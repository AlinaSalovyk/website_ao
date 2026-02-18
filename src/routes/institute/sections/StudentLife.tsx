import type { JSX } from "react";

export const StudentLife = (): JSX.Element => {
    return (
        <section className="w-full bg-white py-24 overflow-hidden">
            <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col">

                {/* Section Title */}
                <h2 className="font-['Roboto',sans-serif] font-bold text-4xl md:text-5xl lg:text-6xl text-black text-right mb-16 md:mb-24">
                    Студентське життя
                </h2>

                <div className="flex flex-col gap-8 lg:gap-12">

                    {/* Row 1: Text Left, Image Right */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <div className="order-2 lg:order-1 flex flex-col gap-6">
                            <p className="font-['Roboto',sans-serif] text-base md:text-lg leading-relaxed text-gray-800">
                                Студентське життя є найкращим періодом для огранювання себе як особистості та формування себе як фахівця. Ти маєш можливість взяти участь у спортивному та/або культурно-мистецькому житті університету, відстоювати свою соціальну позицію будучи учасником волонтерської програми, набувати комунікативні навички у обмінних міжнародних програмах. Це все є ти!
                            </p>
                        </div>
                        <div className="order-1 lg:order-2 w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden">
                            {/* Placeholder generic student image */}
                            <img
                                src="/images/TheInstitute/StudentLife.jpg"
                                alt="Students working together"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Row 2: Image Left, Text Right */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <div className="order-1 w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden">
                            {/* Placeholder generic laptop image */}
                            <img
                                src="/images/TheInstitute/Pexels.jpg"
                                alt="Student working on laptop"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="order-2 flex flex-col gap-6">
                            <p className="font-['Roboto',sans-serif] text-sm md:text-base leading-relaxed text-gray-800">
                                Окрім цього, на факультеті існує студентське самоврядування, що є потужним органом, який долучається до організації освітнього процесу. Представники студентської ради на чолі із студдеканом є членами ради інституту, де мають можливість брати участь у формуванні стратегії розвитку інституту, модернізації освітнього процесу та вирішенні поточних питань. Студенти мають всі можливості для реалізації себе!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
