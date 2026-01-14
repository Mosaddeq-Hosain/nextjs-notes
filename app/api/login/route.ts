import {NextResponse} from 'next/server';
import {db} from  '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';




export async function POST (request: Request) {
    const {email, password} = await request.json();

    const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
    );

    if(result.rows.length === 0){
        return NextResponse.json(
            {error: 'Invalid email or password'},
            {status: 401}
        );   
        
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return NextResponse.json(
            {error: 'Invalid email or password'},
            {status: 401}
        );
    }

   

    

    const response = NextResponse.json(
        {message: 'Login successful',
         status: 200,
         user: {
            id: user.id,
            email: user.email,
            role: user.role
         }
        } 
    );

     const token = jwt.sign(
       { userId : user.id,
        role: user.role},
        process.env.JWT_SECRET!,
        {expiresIn: '1d'}
    );

   response.cookies.set("token", token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    return response;


    // 
}