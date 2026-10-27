import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { styled } from '@mui/material/styles';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

import { Snackbar } from '@mui/material';
import '../App.css';

const Card = styled(MuiCard)(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    maxWidth: '460px',
    padding: '2.5rem',
    gap: '1.5rem',
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 80px rgba(255, 152, 57, 0.06)',
    animation: 'fadeIn 0.8s ease-out',
}));

// Shared sx for text fields
const textFieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        color: '#fff',
        transition: 'all 0.3s ease',
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
            transition: 'border-color 0.3s ease',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(255, 152, 57, 0.4)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#FF9839',
            boxShadow: '0 0 0 3px rgba(255, 152, 57, 0.1)',
        },
    },
    '& .MuiInputBase-input': {
        color: '#fff',
        fontSize: '0.95rem',
        '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.35)',
            opacity: 1,
        },
    },
    '& .MuiFormHelperText-root': {
        color: '#ff6b6b',
    },
};

const formLabelSx = {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 500,
    fontSize: '0.9rem',
    mb: 0.5,
    '&.Mui-focused': {
        color: '#FF9839',
    },
};

export default function AuthenticationPage() {
    const [emailError, setEmailError] = React.useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState(); // for error message
    const [messages, setMessages] = React.useState();

    const [formState, setFormState] = React.useState(0);
    const {handleRegister, handleLogin} = useContext(AuthContext);

    let handleAuth = async () => {
        try {
            // Clear previous errors
            setError('');
            
            if (formState === 0) { // login
                let result = await handleLogin(username, password)
                
            }

            if (formState === 1) { // register — handleRegister stores the token and navigates to /home
                let result = await handleRegister(name, username, password);
                setMessages(result);
                setOpen(true);
                setError(''); // Clear error on success
            }
        }
        catch(err) {
            let message = err.response?.data?.message || err.message || 'An error occurred';
            setError(message);
            setOpen(false); // Close success snackbar if error occurs
        }
    }


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const validateInputs = () => {
        const email = document.getElementById('email');
        const password = document.getElementById('password');

        let isValid = true;

        if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
            setEmailError(true);
            setEmailErrorMessage('Please enter a valid email address.');
            isValid = false;
        } else {
            setEmailError(false);
            setEmailErrorMessage('');
        }

        if (!password.value || password.value.length < 6) {
            setPasswordError(true);
            setPasswordErrorMessage('Password must be at least 6 characters long.');
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage('');
        }

        return isValid;
    };

    return (
        <div className="authPageContainer">
            <Card variant="outlined">
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Typography
                        sx={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #FF9839, #ff5e62)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5,
                            letterSpacing: '-0.3px',
                        }}
                    >
                        Video Conferencing
                    </Typography>
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: 'clamp(1.6rem, 4vw, 2rem)',
                            fontWeight: 700,
                            color: '#fff',
                        }}
                    >
                        {formState === 0 ? 'Welcome Back' : 'Create Account'}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '0.9rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            mt: 0.5,
                        }}
                    >
                        {formState === 0 ? 'Sign in to continue your journey' : 'Get started with a free account'}
                    </Typography>
                </Box>

                <Box
                    component="form"
                    noValidate
                    sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
                >

                    {formState === 1 ?
                        <FormControl>
                            <FormLabel htmlFor="fullName" sx={formLabelSx}>Full Name</FormLabel>
                            <TextField
                                error={emailError}
                                helperText={emailErrorMessage}
                                id="fullName"
                                type="string"
                                name="fullName"
                                placeholder="Enter your full name"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={emailError ? 'error' : 'primary'}
                                sx={textFieldSx}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            /> </FormControl> : <></>}



                    <FormControl>
                        <FormLabel htmlFor="username" sx={formLabelSx}>Username</FormLabel>
                        <TextField
                            error={emailError}
                            helperText={emailErrorMessage}
                            id="username"
                            type="string"
                            name="username"
                            placeholder="Enter your username"
                            autoFocus
                            required
                            fullWidth
                            variant="outlined"
                            color={emailError ? 'error' : 'primary'}
                            sx={textFieldSx}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </FormControl>
                    <FormControl>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <FormLabel htmlFor="password" sx={formLabelSx}>Password</FormLabel>
                            {formState === 0 && (
                                <Link
                                    component="button"
                                    type="button"
                                    onClick={handleClickOpen}
                                    variant="body2"
                                    sx={{
                                        color: '#FF9839',
                                        textDecoration: 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        '&:hover': {
                                            color: '#ff5e62',
                                            textDecoration: 'none',
                                        },
                                    }}
                                >
                                </Link>
                            )}
                        </Box>
                        <TextField
                            error={passwordError}
                            helperText={passwordErrorMessage}
                            name="password"
                            placeholder="••••••••"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            required
                            fullWidth
                            variant="outlined"
                            color={passwordError ? 'error' : 'primary'}
                            sx={textFieldSx}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                            <Typography sx={{
                                color: '#ff6b6b',
                                fontSize: '0.85rem',
                                mt: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                            }}>
                                ⚠ {error}
                            </Typography>
                        )}
                    </FormControl>

                    <Button
                        type="button"
                        fullWidth
                        variant="contained"
                        onClick={handleAuth}
                        sx={{
                            background: 'linear-gradient(135deg, #FF9839 0%, #ff5e62 100%)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '1rem',
                            padding: '0.85rem',
                            borderRadius: '12px',
                            textTransform: 'none',
                            boxShadow: '0 8px 25px rgba(255, 152, 57, 0.3)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #e68933 0%, #e65050 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 12px 35px rgba(255, 152, 57, 0.4)',
                            },
                        }}
                    >
                        {formState === 0 ? 'Sign In' : 'Create Account'}
                    </Button>

                    {formState === 0 ? <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>
                        Don&apos;t have an account?{' '}
                        <span>
                            <Link
                                variant="body2"
                                sx={{
                                    color: '#FF9839',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    '&:hover': { color: '#ff5e62', textDecoration: 'underline' },
                                }}
                                component="button"
                                type="button"
                                onClick={() => setFormState(1)}
                            >
                                Sign up
                            </Link>
                        </span>
                    </Typography> : <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>
                        Already have an account?{' '}
                        <span>
                            <Link
                                variant="body2"
                                sx={{
                                    color: '#FF9839',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    '&:hover': { color: '#ff5e62', textDecoration: 'underline' },
                                }}
                                component="button"
                                type="button"
                                onClick={() => setFormState(0)}
                            >
                                Sign in
                            </Link>
                        </span>
                    </Typography>}

                </Box>
                <Snackbar
                    open={open}
                    autoHideDuration={4000}
                    onClose={handleClose}
                    message={messages}
                />
            </Card>
        </div>
    );
}