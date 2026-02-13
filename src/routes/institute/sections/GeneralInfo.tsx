import { Separator } from "@/components/ui/separator";
import type { JSX } from "react";

export const GeneralInfo = (): JSX.Element => {
    return (
        <section id="general-info" className="w-full bg-white py-24 relative overflow-hidden">
            <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-9 flex flex-col">

                {/* Title */}
                <h2 className="font-['Roboto',sans-serif] font-bold text-4xl md:text-5xl lg:text-6xl text-black mb-12">
                    Загальна інформація
                </h2>

                <Separator className="bg-black/20 h-[1px] w-full mb-12" />

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20 items-stretch">

                    {/* Left Column: Text Content (Span 2) */}
                    <div className="lg:col-span-2 flex flex-col gap-12">
                        {/* Subtitle */}
                        <p className="font-['Roboto',sans-serif] text-xl md:text-2xl text-gray-600 leading-relaxed">
                            Ласкаво просимо до нашого інституту, де знання стають інноваціями, а навчання – стартом для твого успіху в динамічному світі майбутнього!
                        </p>

                        {/* Text Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <p className="text-sm md:text-base leading-relaxed text-gray-800">
                                У нашому Інституті ІТ та бізнесу студенти не лише отримують фундаментальні знання, але й практичні інструменти для роботи в сферах ІТ, штучного інтелекту, аналітики даних, управління, маркетингу, фінансів та підприємництва. Наші програми – це поєднання передових технологій, реальних кейсів від бізнесу та міжнародного досвіду. Ми активно співпрацюємо з провідними компаніями, науковими центрами та глобальними організаціями, щоб наші випускники завжди були на крок попереду.
                            </p>
                            <p className="text-sm md:text-base leading-relaxed text-gray-800">
                                Ми створюємо середовище, де кожен студент розвиває не лише професійні навички, а й критичне мислення, креативність та здатність до постійного навчання. Окрім цього, ми активно займаємося науковими дослідженнями, які допомагають вирішувати сучасні виклики та підтримувати інновації та розвивати цифрову економіку.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Image (Span 1) */}
                    <div className="relative w-full h-full min-h-[400px] lg:min-h-auto rounded-lg overflow-hidden">
                        <img
                            src="/images/TheInstitute/GeneralInformation.png"
                            alt="General Information"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
