/**
 * Verifies the hCaptcha token with the secret key and return the response
 * @param secret {string} - The secret key
 * @param token {string} - The hCaptcha token
 * @returns {Promise<any>} - The response from hCaptcha
 */
export const verify = async (secret: string = process.env.NEXT_PUBLIC_HCAPTCHA_SECRET, token: string): Promise<any> => {
    const response = await fetch(process.env.NEXT_PUBLIC_HCAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `response=${encodeURIComponent(token)}&secret=${encodeURIComponent(process.env.NEXT_PUBLIC_HCAPTCHA_SECRET)}`
    })
    return response.json()

}