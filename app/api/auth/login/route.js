import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode('your-secret-key-change-this');

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        const { data: admin, error } = await supabase
            .from('admin')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, admin.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create session
        const token = await new SignJWT({ id: admin.id, email: admin.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(SECRET_KEY);

        const response = NextResponse.json({ success: true });

        response.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: error.message, details: error.toString() }, { status: 500 });
    }
}
