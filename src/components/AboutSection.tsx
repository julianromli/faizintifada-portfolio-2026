import { Briefcase, MapPin, PaperPlaneTilt } from '@phosphor-icons/react';

export function AboutSection() {
  return (
    <section>
      <div className="bg-[#fafbfc] rounded-[3rem] p-8 sm:p-12 lg:p-16 border border-gray-100/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-6">ABOUT ME</p>
            <h2 className="text-[2rem] sm:text-[2.25rem] leading-[1.2] font-semibold text-gray-900 mb-6 tracking-tight">
              Design is how I solve problems and create impact.
            </h2>
            <p className="text-[16px] leading-relaxed text-gray-600 mb-10 max-w-lg">
              I'm a multidisciplinary designer who loves crafting meaningful and functional digital experiences. With a keen eye for detail and a passion for design, I help brands and products connect with their audience.
            </p>
            <button className="text-white px-8 py-3.5 rounded-full font-medium transition-all text-[15px] btn-embossed">
              More About Me
            </button>
          </div>
          
          {/* Right */}
          <div className="space-y-10 lg:pl-8">
            <div className="flex items-start space-x-6">
              <div className="mt-1">
                <Briefcase size={24} className="text-gray-700" weight="regular" />
              </div>
              <div>
                <p className="text-[17px] font-medium text-gray-800">5+ Years of Experience</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200 ml-[11px] -my-6"></div> {/* Connector line idea, sticking to gap representation */}
            <div className="flex items-start space-x-6">
              <div className="mt-1">
                <MapPin size={24} className="text-gray-700" weight="regular" />
              </div>
              <div>
                <p className="text-[17px] font-medium text-gray-800">Based in Indonesia</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200 ml-[11px] -my-6"></div> {/* Connector line idea, sticking to gap representation */}
            <div className="flex items-start space-x-6">
              <div className="mt-1">
                <PaperPlaneTilt size={24} className="text-gray-700" weight="regular" />
              </div>
              <div>
                <p className="text-[17px] font-medium text-gray-800">Available for Freelance</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
