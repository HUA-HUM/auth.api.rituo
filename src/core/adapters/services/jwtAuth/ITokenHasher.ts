export const TOKEN_HASHER = Symbol('TOKEN_HASHER');

export interface ITokenHasher {
  hash(token: string): Promise<string>;
  compare(token: string, hash: string): Promise<boolean>;
}
