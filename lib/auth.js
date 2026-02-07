import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const secretKey = 'secret-key-change-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);
}

export async function decrypt(input) {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    });
    return payload;
}

export async function login(formData) {
    // Verify credentials against DB here
    const user = { email: formData.email, name: 'Admin' };

    // Create the session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user, expires });

    // Save the session in a cookie
    cookies().set('session', session, { expires, httpOnly: true });
}

export async function logout() {
    // Destroy the session
    cookies().set('session', '', { expires: new Date(0) });
}

export async function getSession() {
    const session = cookies().get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
}
