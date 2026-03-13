import React from "react";

import { partnerLogos } from "@/components/icons/PartnerLogos";

export const PartnersCarousel = () => {
  return (
    <div className="w-full overflow-hidden py-12 bg-pure-white">
      <div className="flex items-center gap-16 animate-marquee-seamless">
        {[...Array(6)].map((_, setIndex) => (
          <React.Fragment key={setIndex}>{partnerLogos}</React.Fragment>
        ))}
      </div>
    </div>
  );
};
