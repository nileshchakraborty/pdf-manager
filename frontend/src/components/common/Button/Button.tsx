import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'onClick'> {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function Button({ children, disabled, onClick, ...props }: ButtonProps) {
  return (
    <MuiButton
      {...props}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </MuiButton>
  );
}
