import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "../hooks/authContext";
import {type User} from "../types/auth";




export function AuthProvider({ children }: { children: ReactNode}) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        //check local storage for user data
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (username:string) => {
        //set user in state and local storage
        const loggedInUser = { username };
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
    };

    const logout = () => {
        //clear user from state and local storage
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value = {{ user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
}

// the original 
// import { createContext, useContext, useState, type ReactNode } from "react";

// interface User {
//     username: string;
// }

// interface AuthContextType {
//     user: User | null;
//     login: (username: string) => void;
//     logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode}) {
//     const [user, setUser] = useState<User | null>(null);

//     const login = (username:string) => {
//         setUser({ username});
//     };

//     const logout = () => {
//         setUser(null);
//     };

//     return (
//         <AuthContext.Provider value = {{ user, login, logout}}>
//             {children}
//         </AuthContext.Provider>
//     );
// }

// export function useAuth() {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error("useAuth must be used within an AuthProvider");
//     }
//     return context;
// }