// export interface SignupBody {
//     ifullname: string;
//     iusername?: string;
//     iemail: string;
//     ipassword: string;
//     irole: 'candidate' | 'employer';
// }
export interface SignupBody {
    ifirstname: string;
    ilastname: string;
    iusername?: string;
    iemail: string;
    ipassword: string;
    idateOfBirth: string;
}

export interface LoginBody {
    iemail: string;
    ipassword: string;
}

export interface resetPasswordBody {
    token: string; 
    inewPassword: string; 
    iconfirmPassword: string
}
