declare namespace NodeJS {
    export interface ProcessEnv {
        // Auth0
        NEXT_PUBLIC_AUTH0_ISSUER: string
        NEXT_PUBLIC_AUTH0_ISSUER_DEV: string
        // HCaptcha
        NEXT_PUBLIC_HCAPTCHA_SECRET: string
        NEXT_PUBLIC_HCAPTCHA_VERIFY_URL: string
    }
}
