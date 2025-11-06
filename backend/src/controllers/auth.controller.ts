import { Request, Response } from 'express';


//signup controller
export const signup = async (_req: Request, res: Response) => {

    // const {ifullname, iusername, iemail, ipassword, irole} = _req.body;


    res.send('This is signup endpoint');    

}

export const login = async (_req: Request, res: Response) => {
    res.send('This is login endpoint');
}

export const logout = async (_req: Request, res: Response) => {
    res.send('This is logout endpoint');
}

// import { pool } from "../lib/db.js";

// export const signup = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;

//     const result = await pool.query(
//       "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
//       [username, email, password]
//     );

//     res.status(201).json({ user: result.rows[0] });
//   } catch (error) {
//     console.error("Signup error:", error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };
