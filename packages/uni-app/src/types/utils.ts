/* 重写 */
export type Override<P, S> = Omit<P, keyof S> & S
