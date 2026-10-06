"use client";

import { useEffect } from "react";
import { awardStamp } from "@/lib/stamps";

/** Finding the secret channel earns its sticker. */
export function SecretArrival() {
  useEffect(() => {
    awardStamp("secret");
  }, []);
  return null;
}
