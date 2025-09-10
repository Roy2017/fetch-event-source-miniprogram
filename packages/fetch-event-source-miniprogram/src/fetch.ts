import { type EventSourceMessage, getLines, getMessages } from './parse.js';

export const EventStreamContentType = 'text/event-stream';

const DefaultRetryInterval = 1000;
const LastEventId = 'last-event-id';

export interface FetchEventSourceInit extends RequestInit {
    /**
     * The request headers. FetchEventSource only supports the Record<string,string> format.
     */
    headers?: Record<string, string>,

    /**
     * Called when a response is received. Use this to validate that the response
     * actually matches what you expect (and throw if it doesn't.) If not provided,
     * will default to a basic validation to ensure the content-type is text/event-stream.
     */
    onopen?: (response: UniNamespace.RequestSuccessCallbackResult) => Promise<void>,

    /**
     * Called when a message is received. NOTE: Unlike the default browser
     * EventSource.onmessage, this callback is called for _all_ events,
     * even ones with a custom `event` field.
     */
    onmessage?: (ev: EventSourceMessage) => void;

    /**
     * Called when a response finishes. If you don't expect the server to kill
     * the connection, you can throw an exception here and retry using onerror.
     */
    onclose?: () => void;

    /**
     * Called when there is any error making the request / processing messages /
     * handling callbacks etc. Use this to control the retry strategy: if the
     * error is fatal, rethrow the error inside the callback to stop the entire
     * operation. Otherwise, you can return an interval (in milliseconds) after
     * which the request will automatically retry (with the last-event-id).
     * If this callback is not specified, or it returns undefined, fetchEventSource
     * will treat every error as retriable and will try again after 1 second.
     */
    onerror?: (err: any) => number | null | undefined | void,

    /**
     * If true, will keep the request open even if the document is hidden.
     * By default, fetchEventSource will close the request and reopen it
     * automatically when the document becomes visible again.
     */
    openWhenHidden?: boolean;

    /** The Fetch function to use. Defaults to fetch */
    fetch?: any;

    data?: UniNamespace.RequestOptions['data'];

    method: UniNamespace.RequestOptions['method']
}

function listener(cb: (data: Uint8Array) => void, { data }: { data: Uint8Array }) {
    if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
    }
    cb?.(data)
}

export function fetchEventSource(input: RequestInfo, {
    signal: inputSignal,
    headers: inputHeaders,
    onopen: inputOnOpen,
    onmessage,
    onclose,
    onerror,
    openWhenHidden,
    fetch: inputFetch,
    data = {},
    ...rest
}: FetchEventSourceInit) {
    return new Promise<void>((resolve, reject) => {
        // make a copy of the input headers since we may modify it below:
        const headers = { ...inputHeaders };
        if (!headers.accept) {
            headers.accept = EventStreamContentType;
        }

        let requestTask: UniNamespace.RequestTask & { isabort?: boolean }

        function onVisibilityChange() {
            requestTask.abort(); // close existing request on every visibility change
            requestTask.isabort = true;
            if (!document.hidden) {
                create(); // page is now visible again, recreate request.
            }
        }

        if (typeof document !== 'undefined' && !openWhenHidden) {
            // TODO 适配小程序环境
            document.addEventListener('visibilitychange', onVisibilityChange);
        }

        let retryInterval = DefaultRetryInterval;
        let retryTimer = 0;
        function dispose() {
            if (typeof document !== 'undefined' && !openWhenHidden) {
                // TODO 适配小程序环境
                document.removeEventListener('visibilitychange', onVisibilityChange);
            }
            clearTimeout(retryTimer);
            requestTask.abort(); // close existing request on every visibility change
            requestTask.isabort = true;
            // @ts-ignore
            requestTask.offChunkReceived(onChunkReceivedCallBack)
            requestTask.offHeadersReceived(onHeadersReceivedCallBack)
        }

        function onHeadersReceivedCallBack(res: UniNamespace.RequestSuccessCallbackResult) {
            onopen(res)
        }

        const onChunkReceivedCallBack = listener.bind(null, (data: Uint8Array) => {
            const onChunk = getLines(getMessages(
                (line) => {
                    // console.log('line', line)
                    onmessage?.(line)
                },
                id => {
                    if (id) {
                        // store the id and send it back on the next retry:
                        headers[LastEventId] = id;
                    } else {
                        // don't send the last-event-id header anymore:
                        delete headers[LastEventId];
                    }
                }, retry => {
                    retryInterval = retry;
                }
            ))
            onChunk(data)
        })

        // @ts-ignore
        const fetchFn = inputFetch ?? wx.request;
        const onopen = inputOnOpen ?? defaultOnOpen;

        async function create() {
            try {
                // 1. 适配 input 为 string 或 Request
                let _url: string = '';
                if (typeof input === 'string') {
                    _url = input;
                } else {
                    // 这里假设 input 是 Request 类型
                    _url = input.url;
                }
                requestTask = fetchFn({
                    url: _url,
                    data,
                    ...rest,
                    header: {
                        ...headers,
                        Accept: 'text/event-stream',
                    },
                    enableChunked: true,
                    responseType: 'arraybuffer',
                    success: (res: any) => {
                        if (res?.statusCode == 200) {
                            onclose?.();
                        }
                        dispose();
                        resolve();
                    },
                    fail: (error: any) => {
                        throw new Error(error)
                    },
                    complete: () => {
                        // console.log('complete')
                    },
                });

                requestTask.onHeadersReceived(onHeadersReceivedCallBack)

                // @ts-ignore
                requestTask.onChunkReceived(onChunkReceivedCallBack)

            } catch (err) {
                console.error('catch error', err)
                if (!requestTask.isabort) {
                    // if we haven't aborted the request ourselves:
                    try {
                        // check if we need to retry:
                        const interval: any = onerror?.(err) ?? retryInterval;
                        // reset
                        clearTimeout(retryTimer);
                        // @ts-ignore
                        requestTask.offChunkReceived(onChunkReceivedCallBack)
                        requestTask.offHeadersReceived(onHeadersReceivedCallBack)
                        // try again
                        retryTimer = setTimeout(create, interval);
                    } catch (innerErr) {
                        // we should not retry anymore:
                        dispose();
                        reject(innerErr);
                    }
                }
            }
        }

        create();
    });
}

function defaultOnOpen(response: UniNamespace.RequestSuccessCallbackResult) {
    const contentType = response.header['content-type'];
    if (!contentType?.startsWith(EventStreamContentType)) {
        throw new Error(`Expected content-type to be ${EventStreamContentType}, Actual: ${contentType}`);
    }
}
