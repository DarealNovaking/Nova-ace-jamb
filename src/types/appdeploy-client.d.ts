declare module '@appdeploy/client' {
  type ApiResponse<T = any> = { data: T }
  type Api = {
    get(path: string): Promise<ApiResponse<any>>
    put(path: string, body?: any): Promise<ApiResponse<any>>
    post(path: string, body?: any): Promise<ApiResponse<any>>
    delete(path: string): Promise<ApiResponse<any>>
  }
  type Auth = {
    getUser(): Promise<any>
    signIn(): Promise<{ user: any }>
    signOut(): Promise<void>
  }
  export const auth: Auth
  export const api: Api
}
