// import { getCurrentUser } from "@/services/auth";
// import { createContext, useContext, useEffect, useState } from "react";

// export interface IUser {
//   id: string;
//   username: string;
//   email?: string;
//   role: "ADMIN" | "STUDENT" | "TEACHER";
//   name?: string;
//   image?: string;
//   isProfileComplete?: boolean;
// }

// interface IUserProviderValues {
//   user: IUser | null;
//   isLoading: boolean;
//   setUser: (user: IUser | null) => void;
// }

// const UserContext = createContext<IUserProviderValues | undefined>(undefined);

// export const UserProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<IUser | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         const data = await getCurrentUser();
//         if (!data) {
//           setUser(null);
//           return;
//         }

//         let profile = data.admin ?? data.student ?? data.teacher ?? {};

//         setUser({
//           id: data.id,
//           username: data.username,
//           role: data.role,
//           name: profile.name,
//           image: profile.profilePicture || "",
//           isProfileComplete: !!profile,
//         });
//       } catch (err) {
//         console.error(err);
//         setUser(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadUser();
//   }, []);

//   return (
//     <UserContext.Provider value={{ user, isLoading, setUser }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => {
//   const context = useContext(UserContext);
//   if (!context) throw new Error("useUser must be used within UserProvider");
//   return context;
// };
