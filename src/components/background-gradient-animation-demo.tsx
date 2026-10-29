import React from "react";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

// Tareeq palette: Paper to Soft Blue base, Royal / Sky blue glows, a touch of Saffron.
export default function BackgroundGradientAnimationDemo() {
  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(250, 247, 242)"
      gradientBackgroundEnd="rgb(230, 240, 255)"
      firstColor="30, 58, 138"
      secondColor="37, 99, 235"
      thirdColor="230, 240, 255"
      fourthColor="242, 169, 59"
      fifthColor="13, 27, 61"
      pointerColor="37, 99, 235"
      blendingValue="soft-light"
    >
      <div className="absolute z-50 inset-0 flex items-center justify-center text-midnight font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
        <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-midnight to-midnight/60">
          Gradients X Animations
        </p>
      </div>
    </BackgroundGradientAnimation>
  );
}
