import type { SVGProps } from "react";

interface SocialSvgProps extends SVGProps<SVGSVGElement> {
  iconColor?: string;
  borderColor?: string;
  iconSize?: string;
}

export const TikTokIcon = ({
  iconColor = "fill-pure-black",
  borderColor = "fill-layout-bg",
  iconSize = "size-8",
  className,
  ...props
}: SocialSvgProps) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${iconSize} ${className ?? ""}`.trim()}
    {...props}
  >
    <path
      d="M36.9141 22.5V34.6855C36.9141 37.5887 34.5604 39.9424 31.6572 39.9424C28.7539 39.9424 26.4004 37.5887 26.4004 34.6855C26.4004 31.7822 28.7539 29.4287 31.6572 29.4287C32.1789 29.4287 32.6832 29.5042 33.1602 29.6445V26.7715C32.6712 26.6874 32.1703 26.6426 31.6572 26.6426C27.2152 26.6426 23.6143 30.2435 23.6143 34.6855C23.6143 39.1275 27.2152 42.7285 31.6572 42.7285C36.0992 42.7285 39.7002 39.1275 39.7002 34.6855V29.1256C41.3624 30.316 43.4004 31.0176 45.6006 31.0176V28.2314C42.2947 28.2314 39.5615 25.7782 39.1201 22.5938C39.1066 22.5008 39.0996 22.4061 39.0996 22.3105H36.9141V22.5Z"
      className={iconColor}
    />
    <mask id="path-2-inside-1_tiktok" className="fill-pure-white">
      <path d="M0 32C0 14.3269 14.3269 0 32 0C49.6731 0 64 14.3269 64 32C64 49.6731 49.6731 64 32 64C14.3269 64 0 49.6731 0 32Z" />
    </mask>
    <path
      d="M32 64V63C14.8792 63 1 49.1208 1 32H0H-1C-1 50.2254 13.7746 65 32 65V64ZM64 32H63C63 49.1208 49.1208 63 32 63V64V65C50.2254 65 65 50.2254 65 32H64ZM32 0V1C49.1208 1 63 14.8792 63 32H64H65C65 13.7746 50.2254 -1 32 -1V0ZM32 0V-1C13.7746 -1 -1 13.7746 -1 32H0H1C1 14.8792 14.8792 1 32 1V0Z"
      className={borderColor}
      mask="url(#path-2-inside-1_tiktok)"
    />
  </svg>
);
