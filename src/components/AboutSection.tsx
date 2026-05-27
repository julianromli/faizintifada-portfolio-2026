import { Briefcase, MapPin, PaperPlaneTilt } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { CONTACT_MAILTO } from '../constants';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const }
  }
};

export function AboutSection() {
  return (
    <motion.section
      id="about"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      <div className="bg-[#fafbfc] rounded-[3rem] p-8 sm:p-12 lg:p-16 border border-gray-100/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left */}
          <div>
            <motion.p variants={itemVariants} className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-6">ABOUT ME</motion.p>
            <motion.h2 variants={itemVariants} className="text-[2rem] sm:text-[2.25rem] leading-[1.2] font-semibold text-gray-900 mb-6 tracking-tight">
              Design is how I solve problems and create impact.
            </motion.h2>
            <motion.p variants={itemVariants} className="text-[16px] leading-relaxed text-gray-600 mb-10 max-w-lg">
              I'm a multidisciplinary designer who loves crafting meaningful and functional digital experiences. With a keen eye for detail and a passion for design, I help brands and products connect with their audience.
            </motion.p>
            <motion.div variants={itemVariants}>
              <a
                href={CONTACT_MAILTO}
                className="inline-block text-white px-8 py-3.5 rounded-full font-medium text-[15px] btn-embossed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                Work With Me
              </a>
            </motion.div>
          </div>
          
          {/* Right */}
          <div className="space-y-10 lg:pl-8">
            <motion.div variants={itemVariants} className="flex items-start space-x-6">
              <div className="mt-1">
                <Briefcase size={24} className="text-gray-700" weight="regular" />
              </div>
              <div>
                <p className="text-[17px] font-medium text-gray-800">5+ Years of Experience</p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="hidden sm:block w-px h-12 bg-gray-200 ml-[11px] -my-6"></motion.div> {/* Connector line idea, sticking to gap representation */}
            <motion.div variants={itemVariants} className="flex items-start space-x-6">
              <div className="mt-1">
                <MapPin size={24} className="text-gray-700" weight="regular" />
              </div>
              <div>
                <p className="text-[17px] font-medium text-gray-800">Based in Indonesia</p>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="hidden sm:block w-px h-12 bg-gray-200 ml-[11px] -my-6"></motion.div> {/* Connector line idea, sticking to gap representation */}
            <motion.div variants={itemVariants} className="flex items-start space-x-6">
              <div className="mt-1">
                <PaperPlaneTilt size={24} className="text-gray-700" weight="regular" />
              </div>
              <div>
                <p className="text-[17px] font-medium text-gray-800">Available for Freelance</p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </motion.section>
  );
}
