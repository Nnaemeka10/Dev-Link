export interface SignupBody {
    ifullname: string;
    iusername?: string;
    iemail: string;
    ipassword: string;
    irole: 'candidate' | 'employer';
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
