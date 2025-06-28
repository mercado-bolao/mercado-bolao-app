import Head from "next/head";
import styles from "../styles/Home.module.css";

const Home = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Bolão TV Loteca</title>
        <meta name="description" content="Sistema de bolão TV Loteca" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Bem-vindo ao Bolão TV Loteca
        </h1>
      </main>
    </div>
  );
};

export default Home;