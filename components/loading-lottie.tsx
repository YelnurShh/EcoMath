"use client";

import { Lottie } from "lottie-react";
import loadingAnimation from "@/assets/loading (1).json";

function LoadingLottie({
  width = 180,
  height = 180,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        src={loadingAnimation}
        loop
        autoplay
        style={{ width, height }}
      />
    </div>
  );
}

export { LoadingLottie };
