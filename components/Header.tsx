'use client'

import styles from "../styles/page.module.css"
import Image from "next/image";


export default function Header() {
    return <header className={styles["header"]}>
    <Image
      alt="dvsa-logo"
      src="/DVSA_logo.jpg"
      width="96"
      height="64"
    ></Image>
    <p>Logs processing</p>
  </header>
}