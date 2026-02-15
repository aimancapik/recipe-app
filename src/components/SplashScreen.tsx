
import React from 'react';

const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden">
            {/* Logo Section */}
            <div className="flex flex-col items-center justify-center animate-fade-in">
                <div className="mb-8 w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB0Z99yTi-Rnz0DJNqedXkdc_TKAUN4COxDTDP_pYprPX_ekPIFa4e9UUpWegFxqfb_4QwgYMyZBPQ5uB2-atlbf29L94Pa-dX8TICVwoa2zQQ_UmTf5mgZZ8ceAXA1JM5jItcaBVi8Fw4Ua2jSd80yr6KYHNAe4iyTFITXb06oQe70oX8kiY0uQaNThNXRlfedzK4QYconxxeEKZxJdfeZ1KNAwKUNTBA1klSstiPydoJcmmtPhEPGGQKk_zQDRNEm_r4INobdV0"
                        alt="Let Em Cook Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                <div className="text-center">
                    <h1 className="text-4xl font-semibold text-[#333333] tracking-tight mb-2">
                        Let Em <span className="text-[#f4e225] font-handwriting text-5xl">Cook</span>
                    </h1>
                    <p className="text-gray-500 text-sm font-light tracking-widest uppercase">WHERE FLAVOR LIVES</p>
                </div>
            </div>

            {/* Loading Indicator */}
            <div className="absolute bottom-16 flex flex-col items-center">
                <div className="flex space-x-2 mb-4">
                    <div className="w-2 h-2 bg-[#f4e225] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#f4e225] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-[#f4e225] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
                <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">GATHERING INGREDIENTS...</span>
            </div>
        </div>
    );
};

export default SplashScreen;
