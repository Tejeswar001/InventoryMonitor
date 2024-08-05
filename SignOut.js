// SignOut.js
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";

const SignOut = () => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("User signed out successfully!");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out: " + error.message);
    }
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
};

export default SignOut;
