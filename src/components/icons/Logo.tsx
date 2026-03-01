import type { JSX } from "react";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "h-10 w-auto" }: LogoProps): JSX.Element => (
  <svg
    width="83"
    height="32"
    viewBox="0 0 83 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Інститут ІТ та Бізнесу"
  >
    <path
      d="M45.6854 0.0372467H13.75V8.37522H45.6854V0.0372467Z"
      fill="currentColor"
    />
    <path
      d="M25.452 13.0111H13.6533V21.3491H25.452V31.9728H33.79V21.3491H45.5887V13.0111H33.79H25.452Z"
      fill="currentColor"
    />
    <path
      d="M81.4999 8.37522V0.0372467H49.5645V31.9727H81.4999V13.011H57.9185V8.37522H81.4999ZM73.1619 21.349V23.6186H57.9185V21.349H73.1619Z"
      fill="currentColor"
    />
    <path
      d="M9.83797 0.0372467H1.5V31.9727H9.83797V0.0372467Z"
      fill="currentColor"
    />
  </svg>
);
