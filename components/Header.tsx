'use client'

import styles from "../styles/page.module.css"
import Image from "next/image";


export default function Header() {
    return <header className={styles["header"]}>
    <img
      alt="dvsa-logo"
      src="/DVSA_logo.jpg"
      width="96"
      height="64"
    ></img>
    <p>Logs processing</p>
  </header>
}