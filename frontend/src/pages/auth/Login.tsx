import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./Auth.module.scss";
import { loginUser } from "../../services/auth.api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await loginUser(username, password);
    if (data.success) {
      navigate("/");
      localStorage.setItem("access_token", data.token);
    } else {
      console.error("Error:", data.message);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.mainLink}>
        <GiPingPongBat className={styles.mainIcon} />
        ft_transcendence
      </Link>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Sign in to your account</h1>
        <div>
          <label htmlFor="username" className={styles.label}>
            Username :
          </label>
          <input
            type="text"
            id="username"
            className={styles.input}
            value={username}
            onChange={handleUsernameChange}
            placeholder="Username"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className={styles.label}>
            Password :
          </label>
          <input
            type="password"
            id="password"
            className={styles.input}
            value={password}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className={styles.button}>
          Sign in
        </button>

        <div className={styles.helpContainer}>
          <p className={styles.helpText}>Don’t have an account yet?</p>
          <Link to={"/register"} className={styles.helpRedirect}>
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
