import { Outlet } from "react-router-dom";
import Logo from "../../assets/images/logo";
import BigImg from "../../assets/images/bigImg";

export default function AuthLayout() {
    return (
        <div className="min-h-screen  from-slate-900 via-slate-800 to-slate-900 flex">

            {/*left side sinup page*/}

            <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative">
                <div className="absolute inset-0 from-blue-600/10 to-purple-600/10"></div>

                <div className="relative z-10 flex flex-col items-center justify-center space-y-8 max-w-lg">
                    <div className="mb-4">
                        <Logo className="w-64 h-auto" />
                    </div>
                    <div className="my-8">
                        <BigImg className="w-80 h-auto drop-shadow-2xl" />
                    </div>

                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
                            Start with Clarity
                        </h1>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Turn big goals into simple projects. Stay organized, focused, and in control — all in one place.
                        </p>
                    </div>
                </div>
            </div>

            {/*right side sinup page*/}

            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
                <div className="w-full max-w-md">
                    <div className="bg-[#141824] py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700">
                        <Outlet />
                        <div className="mt-6 text-center text-xs text-slate-400">
                            © 2025 Idia Corporation |
                            <a href="#" className="ml-1 text-slate-300 hover:text-white transition-colors">
                                Privacy Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
