
"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { FirebaseError } from "firebase-admin";
import {collection, doc, orderBy, where} from "@firebase/firestore";


// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;
import admin from "firebase-admin";


// Set session cookie
export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies();

    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
        expiresIn: SESSION_DURATION * 1000, // milliseconds
    });

    // Set cookie in the browser
    cookieStore.set("session", sessionCookie, {
        maxAge: SESSION_DURATION,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
    });
}

export async function signUp(params: SignUpParams) {
    const { uid, name, email } = params;

    try {
        // check if user exists in db
        await auth.getUser(uid).catch(async () => {
            await auth.createUser({
                uid,
                email,
                displayName: name,
            });
        });

        // save user to db
        await db.collection("users").doc(uid).set({
            name,
            email,
            //profileURL: str ?? "",
            // resumeURL,
        });

        return {
            success: true,
            message: "Account created successfully. Please sign in.",
        };
    } catch (e:unknown) {
        console.error("Error creating user:", e);

        if (
            typeof e === "object" &&
            e !== null &&
            "code" in e &&
            (e as { code: string }).code === "auth/email-already-exists"
        ) {
            return {
                success: false,
                message: "This email is already in use",
            };
        }

        return {
            success: false,
            message: "Something went wrong. Please try again.",
        };

    }
}

export async function signIn(params: SignInParams) {
    const { email, idToken } = params;

    try {
        const userRecord = await auth.getUserByEmail(email);
        if (!userRecord)
            return {
                success: false,
                message: "User does not exist. Create an account.",
            };

        await setSessionCookie(idToken);
    } catch (e: unknown) {
        console.log(e);

        return {
            success: false,
            message: "Failed to log into account. Please try again.",
        };
    }
}

// Sign out user by clearing the session cookie
export async function signOut() {
    const cookieStore = await cookies();

    cookieStore.delete("session");
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();

    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return null;

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

        // get user info from db
        const userRecord = await db
            .collection("users")
            .doc(decodedClaims.uid)
            .get();
        if (!userRecord.exists) {
            await auth.revokeRefreshTokens(decodedClaims.uid);
            return null;
        }

        return {
            ...userRecord.data(),
            id: userRecord.id,
        } as User;
    } catch (e) {
        console.log(e);

        return null;
    }
}

export async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}


