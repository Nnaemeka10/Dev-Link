import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, Users } from 'lucide-react';
import { Input } from '../../../shared/components/Input'; 
import { Checkbox } from '../../../shared/components/Checkbox'; 
import { Button } from '../../../shared/components/Button';
import { signUpSchema, UserRole } from '../types';
import type { SignUpFormData } from '../types';

export const SignUp = () => {
  // Initialize state with the UserRole enum value
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.EMPLOYER);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: UserRole.EMPLOYER,
      agreeToTerms: false,
    },
  });

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data: SignUpFormData) => {
    try {
      console.log('Form data:', data);
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Sign up error:', error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <Briefcase className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-secondary-900">MyJob</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Create account.
            </h1>
            <p className="text-secondary-600">
              Already have account?{' '}
              <Link to="/signin" className="text-primary-600 hover:text-primary-700 font-medium">
                Log In
              </Link>
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="w-full px-4 py-3 rounded-lg border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value={UserRole.EMPLOYER}>Employers</option>
              <option value={UserRole.CANDIDATE}>Candidates</option>
            </select>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register('fullName')}
                placeholder="Full Name"
                error={errors.fullName?.message}
              />
              <Input
                {...register('username')}
                placeholder="Username"
                error={errors.username?.message}
              />
            </div>

            <Input
              {...register('email')}
              type="email"
              placeholder="Email address"
              error={errors.email?.message}
            />

            <Input
              {...register('password')}
              type="password"
              placeholder="Password"
              showPasswordToggle
              error={errors.password?.message}
            />

            <Input
              {...register('confirmPassword')}
              type="password"
              placeholder="Confirm Password"
              showPasswordToggle
              error={errors.confirmPassword?.message}
            />

            <Checkbox
              {...register('agreeToTerms')}
              label={
                <span>
                  I've read and agree with your{' '}
                  <a href="/terms" className="text-primary-600 hover:text-primary-700">
                    Terms of Services
                  </a>
                </span>
              }
              error={errors.agreeToTerms?.message}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Create Account
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-secondary-500">or</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant="outline" className="w-full">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Sign up with Facebook
              </Button>
              <Button type="button" variant="outline" className="w-full">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Stats */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-3 gap-4 h-full">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`${i % 2 === 0 ? 'bg-secondary-700' : 'bg-secondary-600'}`}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-4">
            Over 1,75,324 candidates waiting for good employees.
          </h2>

          <div className="grid grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-1">1,75,324</div>
              <div className="text-secondary-300 text-sm">Live Job</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-1">97,354</div>
              <div className="text-secondary-300 text-sm">Companies</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-1">7,532</div>
              <div className="text-secondary-300 text-sm">New Jobs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


