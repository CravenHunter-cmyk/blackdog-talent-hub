"use client";

import Image from "next/image";

import { BlackDogLogo } from "@/components/brand/BlackDogLogo";

import styles from "./WorkTogetherSection.module.css";

type IconName = "building" | "mail" | "paw" | "users";

function Icon({ name }: { name: IconName }) {
  const strokeProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === "building" && (
        <>
          <path {...strokeProps} d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" />
          <path {...strokeProps} d="M9 21v-4h3v4" />
          <path {...strokeProps} d="M8 7h1" />
          <path {...strokeProps} d="M12 7h1" />
          <path {...strokeProps} d="M8 11h1" />
          <path {...strokeProps} d="M12 11h1" />
          <path {...strokeProps} d="M19 21V10h-2" />
          <path {...strokeProps} d="M3 21h18" />
        </>
      )}
      {name === "mail" && (
        <>
          <rect {...strokeProps} x="3" y="5" width="18" height="14" rx="3" />
          <path {...strokeProps} d="m4 7 8 6 8-6" />
        </>
      )}
      {name === "paw" && (
        <>
          <path
            fill="currentColor"
            d="M12.1 11.4c2.8 0 5.1 2.3 5.1 5 0 1.9-1.4 3.1-3 3.1-.8 0-1.4-.3-2.1-.3s-1.3.3-2.1.3c-1.6 0-3-1.2-3-3.1 0-2.7 2.3-5 5.1-5Z"
          />
          <path
            fill="currentColor"
            d="M6.8 10.3c-1.1.2-2.1-.8-2.4-2.2-.3-1.5.3-2.8 1.4-3s2.1.8 2.4 2.2c.3 1.5-.3 2.8-1.4 3Zm4-1.7c-1.2.1-2.2-1.1-2.3-2.6-.1-1.6.7-2.9 1.9-3s2.2 1.1 2.3 2.6c.1 1.6-.7 2.9-1.9 3Zm5.8 1.7c-1.1-.2-1.7-1.5-1.4-3 .3-1.4 1.3-2.4 2.4-2.2s1.7 1.5 1.4 3c-.3 1.4-1.3 2.4-2.4 2.2Zm-1.8-1.7c-1.2-.1-2-1.4-1.9-3 .1-1.5 1.1-2.7 2.3-2.6s2 1.4 1.9 3c-.1 1.5-1.1 2.7-2.3 2.6Z"
          />
        </>
      )}
      {name === "users" && (
        <>
          <path {...strokeProps} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle {...strokeProps} cx="9" cy="7" r="4" />
          <path {...strokeProps} d="M22 21v-2a4 4 0 0 0-3-3.9" />
          <path {...strokeProps} d="M16 3.1a4 4 0 0 1 0 7.8" />
        </>
      )}
    </svg>
  );
}

export function WorkTogetherSection() {
  return (
    <section
      className={styles.workTogetherSection}
      aria-labelledby="work-together-title"
      data-work-together-root="true"
    >
      <div className={styles.backgroundSoftOverlay} aria-hidden="true" />

      <div className={styles.inner}>
        <div
          className={styles.brandRow}
          aria-label="BlackDog"
          data-work-together-movable="brand-row"
          data-work-together-label="Brand row"
        >
          <BlackDogLogo size="md" tone="default" />
        </div>

        <div
          className={styles.header}
          data-work-together-movable="header-group"
          data-work-together-label="Header group"
        >
          <h2
            id="work-together-title"
            className={styles.title}
            data-work-together-movable="title"
            data-work-together-label="Title"
          >
            Let’s create <span>great work together</span>
          </h2>
          <span
            className={styles.titleRule}
            aria-hidden="true"
            data-work-together-movable="title-rule"
            data-work-together-label="Title underline"
          />
          <p
            className={styles.subtitle}
            data-work-together-movable="subtitle"
            data-work-together-label="Subtitle"
          >
            Whether you’re building the future or shaping your career,
            <br />
            BlackDog is here to <strong>connect</strong> and <strong>create impact.</strong>
          </p>
        </div>

        <div
          className={styles.relationship}
          aria-label="Clients, BlackDog and Talent collaboration relationship"
          data-work-together-movable="relationship-group"
          data-work-together-label="Relationship group"
        >
          <div
            className={`${styles.nodeCard} ${styles.clientsCard}`}
            data-work-together-movable="clients-card"
            data-work-together-label="Clients card"
          >
            <div
              className={styles.nodeIcon}
              data-work-together-movable="clients-icon"
              data-work-together-label="Clients icon"
            >
              <Icon name="building" />
            </div>
            <h3 data-work-together-movable="clients-title" data-work-together-label="Clients title">
              Clients
            </h3>
            <span
              className={styles.nodeRule}
              aria-hidden="true"
              data-work-together-movable="clients-rule"
              data-work-together-label="Clients underline"
            />
            <p data-work-together-movable="clients-copy" data-work-together-label="Clients copy">
              Bring your goals.
              <br />
              We deliver impact.
            </p>
            <div
              className={`${styles.cardArt} ${styles.clientsArt}`}
              aria-hidden="true"
              data-work-together-movable="clients-art"
              data-work-together-label="Clients art"
            />
          </div>

          <div
            className={styles.centerCard}
            data-work-together-movable="blackdog-card"
            data-work-together-label="BlackDog center"
          >
            <div
              className={styles.pawMark}
              data-work-together-movable="blackdog-paw"
              data-work-together-label="BlackDog paw"
            >
              <Image
                src="/images/Logo_icon_tight.png"
                alt=""
                width={54}
                height={54}
                className={styles.pawMarkImage}
                unoptimized
              />
            </div>
            <h3 data-work-together-movable="blackdog-title" data-work-together-label="BlackDog title">
              BlackDog
            </h3>
            <p data-work-together-movable="blackdog-copy" data-work-together-label="BlackDog copy">
              Connect. Collaborate.
              <br />
              Create together.
            </p>
          </div>

          <div
            className={`${styles.nodeCard} ${styles.talentCard}`}
            data-work-together-movable="talent-card"
            data-work-together-label="Talent card"
          >
            <div
              className={styles.nodeIcon}
              data-work-together-movable="talent-icon"
              data-work-together-label="Talent icon"
            >
              <Icon name="users" />
            </div>
            <h3 data-work-together-movable="talent-title" data-work-together-label="Talent title">
              Talent
            </h3>
            <span
              className={styles.nodeRule}
              aria-hidden="true"
              data-work-together-movable="talent-rule"
              data-work-together-label="Talent underline"
            />
            <p data-work-together-movable="talent-copy" data-work-together-label="Talent copy">
              Share your expertise.
              <br />
              Grow with us.
            </p>
            <div
              className={`${styles.cardArt} ${styles.talentArt}`}
              aria-hidden="true"
              data-work-together-movable="talent-art"
              data-work-together-label="Talent art"
            />
          </div>
        </div>

        <div
          className={styles.contactBar}
          data-work-together-movable="contact-bar"
          data-work-together-label="Contact bar"
        >
          <div
            className={styles.contactIntro}
            data-work-together-movable="contact-intro"
            data-work-together-label="Contact intro"
          >
            <div
              className={styles.mailCircle}
              data-work-together-movable="contact-mail-circle"
              data-work-together-label="Contact mail circle"
            >
              <Icon name="mail" />
            </div>
            <div
              data-work-together-movable="contact-text"
              data-work-together-label="Contact text"
            >
              <h3
                data-work-together-movable="contact-title"
                data-work-together-label="Contact title"
              >
                Let’s start a conversation
              </h3>
              <p data-work-together-movable="contact-copy" data-work-together-label="Contact copy">
                We’d love to hear from you.
              </p>
            </div>
          </div>

          <span
            className={styles.contactDivider}
            aria-hidden="true"
            data-work-together-movable="contact-divider"
            data-work-together-label="Contact divider"
          />

          <a
            href="mailto:blackdog_one@outlook.com"
            className={styles.emailLink}
            data-work-together-movable="email-link"
            data-work-together-label="Email link"
          >
            <span
              className={styles.emailIcon}
              data-work-together-movable="email-icon"
              data-work-together-label="Email icon"
            >
              <Icon name="mail" />
            </span>
            <span data-work-together-movable="email-text" data-work-together-label="Email text">
              blackdog_one@outlook.com
            </span>
          </a>

          <div
            className={styles.contactArt}
            aria-hidden="true"
            data-work-together-movable="contact-art"
            data-work-together-label="Contact art"
          >
            <span
              className={styles.chatBubble}
              data-work-together-movable="chat-bubble"
              data-work-together-label="Chat bubble"
            />
            <span
              className={styles.peopleLine}
              data-work-together-movable="people-line"
              data-work-together-label="People line"
            />
            <span
              className={styles.globeLine}
              data-work-together-movable="globe-line"
              data-work-together-label="Globe line"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
