// type State =
//   | { status: "loading" }
//   | { status: "error"; message: string }
//   | { status: "success"; data: User[] };

import { useState } from "react";

// function UserList({ state }: { state: State }) {
//   switch (state.status) {
//     case "loading":
//       return <Spinner />;

// case "error":
//       return <ErrorMessage message={state.message} />;
//     case "success":
//       return <Users users={state.data} />;
//   }
// }

type User = {
  id: number;
  name: string;
  email: string;
};

function getValue<T, K extends keyof T>(
  object: T,
  key: K
) {
  return object[key];
}

const user = {
    id: 1,
    name: "swyft",
    email: "nikolamatic225@gmail.com"
} satisfies User

getValue(user, "name");

// as const over enum

const OrderStatus = {
  Pending: 'PENDING',
  Confirmed: 'CONFIRMED',
  Cancelled: 'CANCELLED',
} as const;

type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

function useLocalStorage<K>(key: string, initialValue: K) {
  const [value, setValue] = useState<K>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });
  const updateValue = (newValue: K) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };
  return [value, updateValue] as const;
}

const [value, update] = useLocalStorage("i", "yo")