import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

const socialIcons = [
  {
    url: "https://c.animaapp.com/mkvpx7lhh8vezq/img/component-1-3.svg",
    alt: "Social icon 1",
  },
  {
    url: "https://c.animaapp.com/mkvpx7lhh8vezq/img/component-1-2.svg",
    alt: "Social icon 2",
  },
  {
    url: "https://c.animaapp.com/mkvpx7lhh8vezq/img/component-1-1.svg",
    alt: "Social icon 3",
  },
  {
    url: "https://c.animaapp.com/mkvpx7lhh8vezq/img/component-1.svg",
    alt: "Social icon 4",
  },
];

const navigationItems = [
  { label: "ГОЛОВНА", isActive: true },
  { label: "ПРО ІНСТИТУТ", isActive: false },
  { label: "ОСВІТНІ ПРОГРАМИ", isActive: false },
  { label: "НОВИНИ ТА ПОДІЇ", isActive: false },
];

export const InstituteLeadershipSection = (): JSX.Element => {
  const handleMenuClick = () => {
    window.location.href = "/menu";
  };

  return (
    <section className="flex flex-col w-full items-start relative">
      <header className="items-start gap-8 px-0 py-20 w-full bg-white flex flex-col relative translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
        <Separator className="w-full bg-[#0f1215]" />

        <div className="flex flex-col max-w-[1440px] mx-auto w-full items-start px-9 py-0">
          <nav className="flex items-start gap-[114px] w-full">
            <div className="flex items-start gap-6">
              {socialIcons.map((icon, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="icon"
                  className="w-16 h-16 rounded-full border-[#0f1215] hover:bg-[#0f1215] hover:border-[#0f1215] transition-colors"
                >
                  <img src={icon.url} alt={icon.alt} className="w-5 h-5" />
                </Button>
              ))}
            </div>

            <div className="flex-1" />

            <div className="flex flex-col w-[228px] items-start gap-3.5">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  className="flex max-w-[310px] items-center w-full group cursor-pointer"
                  onClick={handleMenuClick}
                >
                  <div className="flex flex-col items-start flex-1">
                    <div className="flex items-start w-full">
                      <span
                        className={`[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[8px] tracking-[0] leading-[14px] whitespace-nowrap ${item.isActive ? "text-[#0e52ff]" : "text-black"
                          } group-hover:text-[#0e52ff] transition-colors`}
                      >
                        {item.label}
                      </span>
                      <div className="w-[9.69px] h-2.5 ml-auto mr-[-0.69px] overflow-hidden">
                        <div className="relative top-0.5 left-2.5 w-[5px] h-[5px] bg-[#0e52ff]" />
                      </div>
                    </div>
                    <Separator className="w-full bg-black" />
                  </div>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <div className="flex flex-col w-full items-center justify-center px-0 py-8 bg-[#0f1215] relative">
        <img
          className="absolute top-0 left-0 w-full h-full object-cover"
          alt="Background"
          src="https://c.animaapp.com/mkvpx7lhh8vezq/img/image.png"
        />

        <div className="absolute top-0 left-0 w-full h-full bg-[#0e52ff]" />

        <div className="flex flex-col max-w-[1440px] w-full items-start justify-center px-9 py-0 relative flex-1">
          <div className="flex flex-col items-start justify-between flex-1 w-full">
            <div className="flex items-start justify-between flex-1 w-full gap-6 mb-9 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
              <Card className="w-[413px] bg-[#1628f3] border-none rounded-lg hover:scale-105 transition-transform">
                <CardContent className="flex flex-col items-start gap-[247.48px] p-6">
                  <div className="flex flex-col items-start gap-6 w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="[font-family:'Atyp_Display-Regular',Helvetica] font-normal text-xs leading-[14px] text-white tracking-[0]">
                        ПРО ІНСТИТУТ
                      </span>
                      <img
                        className="w-[13px] h-2"
                        alt="Arrow"
                        src="https://c.animaapp.com/mkvpx7lhh8vezq/img/vector.svg"
                      />
                    </div>

                    <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[32px] leading-[38px] text-white tracking-[0]">
                      Розвиток та <br />
                      Інновації в ІТ та Бізнесі
                    </h2>
                  </div>

                  <p className="[font-family:'Atyp_Text-Regular',Helvetica] font-normal text-white text-xs tracking-[0] leading-[18px]">
                    Бізнес й аналітика, Комп&apos;ютерні науки, <br />
                    Фінанси та банківська справа, Маркетинг,
                    <br />
                    Менеджмент, Прикладна математика
                  </p>
                </CardContent>
              </Card>

              <Card className="flex-1 bg-[#0e52ff] border-none rounded-lg overflow-hidden hover:scale-105 transition-transform">
                <CardContent className="flex flex-col items-start gap-[220px] p-6">
                  <div className="flex flex-col items-start gap-6 w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="[font-family:'Atyp_Display-Regular',Helvetica] font-normal text-xs leading-[14px] text-white tracking-[0]">
                        ДАВАЙ ТРИМАТИ КОНТАКТ
                      </span>
                      <img
                        className="w-[13px] h-2"
                        alt="Arrow"
                        src="https://c.animaapp.com/mkvpx7lhh8vezq/img/vector.svg"
                      />
                    </div>

                    <h2 className="[font-family:'Atyp_Display-Medium',Helvetica] font-medium text-[32px] leading-[38px] text-white tracking-[0]">
                      Нумо змінювати світ <br />
                      разом з нами!
                    </h2>
                  </div>

                  <div className="flex items-end gap-[172px] w-full">
                    <div className="inline-flex flex-col items-start justify-end">
                      <h3 className="[font-family:'Atyp_Display-Semibold',Helvetica] font-normal text-iitwhite text-7xl tracking-[0] leading-[80px] whitespace-nowrap">
                        Start Studying
                      </h3>
                    </div>

                    <div className="inline-flex flex-col min-w-[180px] items-start">
                      <div className="flex flex-col w-[229px] items-start gap-[3px]">
                        <button className="flex items-center justify-between w-full group cursor-pointer">
                          <div className="relative w-[181px] h-4">
                            <span className="h-4 flex items-center justify-center text-white text-xs leading-4 whitespace-nowrap [font-family:'Atyp_Text-Regular',Helvetica] font-normal tracking-[0] group-hover:opacity-80 transition-opacity">
                              Контактуй з нами
                            </span>
                          </div>
                          <img
                            className="w-[19px] h-3"
                            alt="Arrow"
                            src="https://c.animaapp.com/mkvpx7lhh8vezq/img/arrow.svg"
                          />
                        </button>
                        <Separator className="w-[229px] bg-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <footer className="flex flex-col items-start pt-9 w-full bg-transparent translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
              <div className="flex items-center gap-8 w-full flex-wrap">
                <button className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-white text-xs tracking-[0] leading-[18px] whitespace-nowrap hover:opacity-80 transition-opacity">
                  Cookie Preference
                </button>

                <span className="[font-family:'Atyp_Text-Medium',Helvetica] font-medium text-white text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                  Національний університет &quot;Острозька академія&quot;
                </span>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
};
