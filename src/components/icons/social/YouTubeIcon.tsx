import type { SVGProps } from "react";

interface SocialSvgProps extends SVGProps<SVGSVGElement> {
  iconColor?: string;
  borderColor?: string;
  iconSize?: string;
}

export const YouTubeIcon = ({
  iconColor = "fill-pure-black",
  borderColor = "fill-layout-bg",
  iconSize = "size-8",
  className,
  ...props
}: SocialSvgProps) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${iconSize} ${className ?? ""}`.trim()} {...props}>
    <mask id="mask0_530_5785" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="22" width="20" height="20">
      <path d="M42 22H22V42H42V22Z" className="fill-pure-white" />
    </mask>
    <g mask="url(#mask0_530_5785)">
      <path d="M41.5781 27.1856C41.4643 26.7628 41.2414 26.3773 40.9318 26.0677C40.6222 25.7581 40.2367 25.5352 39.8139 25.4214C38.2568 25 32 25 32 25C32 25 25.7432 25 24.1861 25.4214C23.7633 25.5352 23.3778 25.7581 23.0682 26.0677C22.7586 26.3773 22.5357 26.7628 22.4219 27.1856C22.1312 28.7736 21.9901 30.3853 22.0005 31.9996C21.9901 33.6139 22.1312 35.2257 22.4219 36.8137C22.5357 37.2365 22.7586 37.622 23.0682 37.9316C23.3778 38.2412 23.7633 38.464 24.1861 38.5778C25.7432 38.9992 32 38.9992 32 38.9992C32 38.9992 38.2568 38.9992 39.8139 38.5778C40.2367 38.464 40.6222 38.2412 40.9318 37.9316C41.2414 37.622 41.4643 37.2365 41.5781 36.8137C41.8688 35.2257 42.0099 33.6139 41.9995 31.9996C42.0099 30.3853 41.8688 28.7736 41.5781 27.1856ZM30.0001 34.9995V28.9998L35.1927 31.9996L30.0001 34.9995Z" className={iconColor} />
    </g>
    <mask id="path-4-inside-1_530_5785" className="fill-pure-white">
      <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
    </mask>
    <path d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z" className={borderColor} mask="url(#path-4-inside-1_530_5785)" />
  </svg>
);
