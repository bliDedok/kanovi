"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Delete,
  Moon,
  Sun,
  UserRound,
  ChefHat,
} from "lucide-react";
import ShinyText from "../components/ShinyText";

const USERS = [
  { username: "novi", name: "Kak Novi", role: "Owner", icon: "owner" },
  { username: "dimas", name: "Kak Dimas", role: "Owner", icon: "owner" },
  { username: "diah", name: "Kak Diah", role: "Kasir", icon: "cashier" },
  { username: "reza", name: "Kak Reza", role: "Kasir", icon: "cashier" },
];

type User = {
  username: string;
  name: string;
  role: string;
  icon: string;
};

export default function LoginPage() {
  const [pickedUser, setPickedUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("kanovi_theme");

    if (
      savedTheme === "dark" ||
      document.documentElement.classList.contains("dark")
    ) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kanovi_theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kanovi_theme", "dark");
      setIsDarkMode(true);
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 6 && selectedUser) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg("");

      if (newPin.length === 6) {
        submitLogin(selectedUser.username, newPin);
      }
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const submitLogin = async (username: string, passwordPin: string) => {
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: passwordPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg("PIN Salah!");
        setPin("");
        setIsLoading(false);
        return;
      }

      document.cookie = `kanovi_token=${data.token}; path=/; max-age=86400;`;
      document.cookie = `kanovi_role=${data.role}; path=/; max-age=86400;`;

      router.push(data.role === "OWNER" ? "/dashboard" : "/pos");
      router.refresh();
    } catch {
      setErrorMsg("Server error.");
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!pickedUser) {
      setIsAccountOpen(true);
      return;
    }

    setSelectedUser(pickedUser);
    setPin("");
    setErrorMsg("");
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPin("");
    setErrorMsg("");
  };

  const AccountIcon = ({ type }: { type: string }) => {
    if (type === "cashier") {
      return <ChefHat className="h-5 w-5" strokeWidth={1.9} />;
    }

    return <UserRound className="h-5 w-5" strokeWidth={1.9} />;
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#edf2f4] p-4 font-sans text-[#20272c] transition-colors duration-500 dark:bg-[#311B14] dark:text-[#f7efe7] sm:p-8">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,rgba(237,242,244,1)_36%,rgba(226,233,236,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(92,53,39,0.82)_0%,rgba(49,27,20,1)_45%,rgba(27,13,9,1)_100%)]" />
      <div className="pointer-events-none absolute -left-28 -top-28 z-0 h-80 w-80 rounded-full bg-white/70 blur-3xl dark:bg-white/[0.045]" />
      <div className="pointer-events-none absolute -bottom-32 -right-28 z-0 h-96 w-96 rounded-full bg-[#dce5e9]/70 blur-3xl dark:bg-[#A97142]/12" />

      <button
        onClick={toggleTheme}
        className="absolute right-6 top-6 z-30 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2f4] text-[#20272c] shadow-[8px_8px_18px_rgba(130,145,152,0.2),-8px_-8px_18px_rgba(255,255,255,0.95)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.95)] dark:bg-white/[0.07] dark:text-white dark:shadow-[8px_8px_18px_rgba(0,0,0,0.3),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]"
        title="Ganti Tema"
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5 text-[#FFD28A]" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      <div className="relative z-10 w-full max-w-[470px]">
        <div className="rounded-[2.3rem] border border-white/70 bg-[#edf2f4]/92 p-6 shadow-[22px_22px_52px_rgba(130,145,152,0.22),-18px_-18px_44px_rgba(255,255,255,0.94)] backdrop-blur-xl transition-all duration-500 dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[22px_22px_52px_rgba(0,0,0,0.36),-9px_-9px_28px_rgba(255,255,255,0.035)] sm:p-8">
          {!selectedUser && (
            <div className="animate-fade-in">
              <div className="mb-8 text-center">

                <h1 className="text-2xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] sm:text-3xl">
                  <ShinyText
                    text="welcome back to kanovi!"
                    speed={1.6}
                    color={isDarkMode ? "#F9E7D2" : "#20272c"}
                    shineColor={isDarkMode ? "#FFD28A" : "#8a969c"}
                    spread={95}
                  />
                </h1>

                <p className="mt-2 text-sm font-semibold tracking-wide text-[#6f7a80] dark:text-white/55 sm:text-base">
                  who is on duty today? choose your account
                </p>
              </div>

              <div className="rounded-[1.9rem] bg-[#edf2f4] p-3 shadow-[inset_6px_6px_12px_rgba(130,145,152,0.18),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.25),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]">
                <button
                  onClick={() => setIsAccountOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-[1.55rem] bg-[#edf2f4] px-5 py-4 text-left text-[#20272c] shadow-[9px_9px_20px_rgba(130,145,152,0.2),-9px_-9px_20px_rgba(255,255,255,0.95)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_6px_6px_12px_rgba(130,145,152,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.95)] dark:bg-white/[0.07] dark:text-white dark:shadow-[9px_9px_20px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]"
                >
                  <div>
                    <p className="text-sm font-black text-[#8a969c] dark:text-white/40">
                      switch account
                    </p>
                    <p className="mt-1 text-lg font-black">
                      {pickedUser ? pickedUser.name : "Pilih akun"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden items-center -space-x-2 sm:flex">
                      {USERS.slice(0, 3).map((user) => (
                        <div
                          key={user.username}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf2f4] text-[#20272c] shadow-[4px_4px_9px_rgba(130,145,152,0.18),-4px_-4px_9px_rgba(255,255,255,0.9)] dark:bg-white/[0.08] dark:text-white dark:shadow-[4px_4px_9px_rgba(0,0,0,0.22),-3px_-3px_8px_rgba(255,255,255,0.03)]"
                        >
                          <AccountIcon type={user.icon} />
                        </div>
                      ))}

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b8824d] text-xs font-black text-white shadow-[4px_4px_9px_rgba(130,145,152,0.18)] dark:bg-[#FFD28A] dark:text-[#311B14]">
                        +1
                      </div>
                    </div>

                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf2f4] shadow-[inset_4px_4px_8px_rgba(130,145,152,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.08] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.24),inset_-4px_-4px_8px_rgba(255,255,255,0.035)]">
                      {isAccountOpen ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isAccountOpen
                      ? "grid-rows-[1fr] pt-3 opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="rounded-[1.55rem] bg-[#edf2f4] p-2 shadow-[inset_6px_6px_12px_rgba(130,145,152,0.2),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.25),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]">
                      <div className="mb-1 flex items-center justify-between px-4 py-3">
                        <p className="text-sm font-black text-[#6f7a80] dark:text-white/50">
                          Switch account
                        </p>

                        <button
                          onClick={() => setIsAccountOpen(false)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf2f4] text-[#20272c] shadow-[5px_5px_11px_rgba(130,145,152,0.18),-5px_-5px_11px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_4px_4px_8px_rgba(130,145,152,0.22),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[5px_5px_11px_rgba(0,0,0,0.24),-3px_-3px_9px_rgba(255,255,255,0.03)]"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {USERS.map((user) => {
                          const active = pickedUser?.username === user.username;

                          return (
                            <button
                              key={user.username}
                              onClick={() => {
                                setPickedUser(user);
                                setErrorMsg("");
                                setPin("");
                                setIsAccountOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-[1.35rem] px-4 py-3 text-left transition-all duration-300 ${
                                active
                                  ? "bg-[#edf2f4] text-[#20272c] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] dark:bg-white/[0.085] dark:text-white dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]"
                                  : "bg-[#edf2f4] text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.16),-7px_-7px_16px_rgba(255,255,255,0.9)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.2),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.06] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.22),-4px_-4px_12px_rgba(255,255,255,0.03)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.26),inset_-5px_-5px_10px_rgba(255,255,255,0.03)]"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                                    active
                                      ? "bg-[#b8824d] text-white shadow-[4px_4px_9px_rgba(130,145,152,0.16)] dark:bg-[#FFD28A] dark:text-[#311B14]"
                                      : "bg-[#edf2f4] text-[#20272c] shadow-[inset_3px_3px_7px_rgba(130,145,152,0.18),inset_-3px_-3px_7px_rgba(255,255,255,0.86)] dark:bg-white/[0.08] dark:text-white dark:shadow-none"
                                  }`}
                                >
                                  <AccountIcon type={user.icon} />
                                </div>

                                <div>
                                  <p className="font-black">{user.name}</p>
                                  <p className="text-sm font-semibold text-[#6f7a80] dark:text-white/45">
                                    {user.role}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-sm font-black ${
                                  active
                                    ? "text-[#b8824d] dark:text-[#FFD28A]"
                                    : "text-[#8a969c] dark:text-white/40"
                                }`}
                              >
                                {active ? "selected" : "choose"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-4 rounded-2xl bg-[#edf2f4] px-4 py-3 text-center text-sm font-black text-red-500 shadow-[inset_5px_5px_10px_rgba(130,145,152,0.2),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.06] dark:text-red-300 dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.25),inset_-5px_-5px_10px_rgba(255,255,255,0.03)]">
                  {errorMsg}
                </div>
              )}

              <div className="mt-7 flex justify-end">
                <button
                  onClick={handleNext}
                  className="group flex items-center gap-3 rounded-[1.6rem] bg-[#edf2f4] px-5 py-3 text-xl font-black text-[#20272c] shadow-[9px_9px_20px_rgba(130,145,152,0.2),-9px_-9px_20px_rgba(255,255,255,0.95)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_6px_6px_12px_rgba(130,145,152,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.95)] dark:bg-white/[0.07] dark:text-white dark:shadow-[9px_9px_20px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]"
                >
                  next
                  <span className="flex h-11 w-14 items-center justify-center rounded-full bg-[#20272c] text-white transition-all duration-300 group-hover:bg-[#b8824d] dark:bg-white dark:text-[#311B14]">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="animate-fade-in">
              <button
                onClick={handleBack}
                className="mb-6 flex items-center gap-2 rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black text-[#6f7a80] shadow-[7px_7px_16px_rgba(130,145,152,0.16),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all hover:text-[#20272c] active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:text-white/55 dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:hover:text-white dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]"
              >
                <ArrowLeft className="h-4 w-4" />
                go back
              </button>

              <div className="mb-7 text-center">

                <h1 className="text-2xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] sm:text-3xl">
                  <ShinyText
                    text="secret code, please!"
                    speed={1.6}
                    color={isDarkMode ? "#F9E7D2" : "#20272c"}
                    shineColor={isDarkMode ? "#FFD28A" : "#8a969c"}
                    spread={95}
                  />
                </h1>

                <p className="mt-2 text-base font-semibold text-[#6f7a80] dark:text-white/55">
                  Let&apos;s make today&apos;s shift a great one!
                </p>
              </div>

              <div className="rounded-[1.9rem] bg-[#edf2f4] px-5 py-6 shadow-[inset_6px_6px_12px_rgba(130,145,152,0.18),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.25),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]">
                {errorMsg && (
                  <div className="mb-6 rounded-2xl bg-[#edf2f4] p-3 text-center text-sm font-black text-red-500 shadow-[inset_5px_5px_10px_rgba(130,145,152,0.2),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.06] dark:text-red-300 dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.25),inset_-5px_-5px_10px_rgba(255,255,255,0.03)]">
                    {errorMsg}
                  </div>
                )}

                <div className="mb-7 flex justify-center gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`h-4 w-4 rounded-full transition-all duration-300 sm:h-5 sm:w-5 ${
                        index < pin.length
                          ? "scale-110 bg-[#b8824d] shadow-[4px_4px_9px_rgba(130,145,152,0.18)] dark:bg-[#FFD28A]"
                          : "bg-[#edf2f4] shadow-[inset_3px_3px_7px_rgba(130,145,152,0.22),inset_-3px_-3px_7px_rgba(255,255,255,0.88)] dark:bg-white/[0.08] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.25),inset_-3px_-3px_7px_rgba(255,255,255,0.03)]"
                      }`}
                    />
                  ))}
                </div>

                <div className="mx-auto grid max-w-60 grid-cols-3 gap-3 sm:max-w-[280px] sm:gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num.toString())}
                      disabled={isLoading}
                      className="aspect-square rounded-2xl bg-[#edf2f4] text-xl font-black text-[#20272c] shadow-[8px_8px_18px_rgba(130,145,152,0.2),-8px_-8px_18px_rgba(255,255,255,0.95)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_6px_6px_12px_rgba(130,145,152,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.95)] disabled:opacity-60 dark:bg-white/[0.07] dark:text-white dark:shadow-[8px_8px_18px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)] sm:text-2xl"
                    >
                      {num}
                    </button>
                  ))}

                  <div />

                  <button
                    onClick={() => handleNumberClick("0")}
                    disabled={isLoading}
                    className="aspect-square rounded-2xl bg-[#edf2f4] text-xl font-black text-[#20272c] shadow-[8px_8px_18px_rgba(130,145,152,0.2),-8px_-8px_18px_rgba(255,255,255,0.95)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_6px_6px_12px_rgba(130,145,152,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.95)] disabled:opacity-60 dark:bg-white/[0.07] dark:text-white dark:shadow-[8px_8px_18px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)] sm:text-2xl"
                  >
                    0
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={isLoading || pin.length === 0}
                    className="flex aspect-square items-center justify-center rounded-2xl bg-[#edf2f4] text-red-500 shadow-[8px_8px_18px_rgba(130,145,152,0.2),-8px_-8px_18px_rgba(255,255,255,0.95)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_6px_6px_12px_rgba(130,145,152,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.95)] disabled:opacity-40 dark:bg-white/[0.07] dark:text-red-300 dark:shadow-[8px_8px_18px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]"
                  >
                    <Delete className="h-6 w-6" />
                  </button>
                </div>

                {isLoading && (
                  <p className="mt-5 text-center text-sm font-black text-[#8a969c] dark:text-white/40">
                    checking your secret code...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}