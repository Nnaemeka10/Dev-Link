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