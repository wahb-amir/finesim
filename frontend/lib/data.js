import { Car, Lightbulb, Wallet, AlertCircle, Zap, RefreshCw, XCircle, CheckCircle, Rocket } from "lucide-react";

export const compoundYears = [1, 2, 3, 5, 10, 20, 30];

export function calcCompound(principal, rate, years) {
  return Math.round(principal * Math.pow(1 + rate / 100, years));
}

export const tickerFacts = [
  "Investing $5/day from age 20 = $1M by retirement",
  "Credit card debt doubles every 3.5 years at 22% APR",
  "78% of Americans live paycheck to paycheck regardless of income",
  "The average car payment is now $726/month",
  "Only 24% of millennials are financially literate",
  "Starting at 25 vs 35 doubles your retirement wealth",
  "Emergency fund saves more than any investment strategy",
];

export const myths = [
  {
    myth: "Renting is just throwing money away",
    reality:
      "Renting can outperform buying in high-cost markets. Flexibility has financial value too.",
    verdict: "It depends",
    color: "#F59E0B",
  },
  {
    myth: "You need to earn more to build wealth",
    reality:
      "How you spend matters more than how much you earn. A $50k saver can outperform a $150k spender.",
    verdict: "False",
    color: "#EF4444",
  },
  {
    myth: "A good credit score means you're good with money",
    reality:
      "A credit score measures how reliably you use debt — not your actual wealth or savings rate.",
    verdict: "Misleading",
    color: "#F59E0B",
  },
  {
    myth: "Investing is too risky for young people",
    reality:
      "Time horizon is your greatest asset. At 22, a market crash is an opportunity, not a threat.",
    verdict: "False",
    color: "#EF4444",
  },
  {
    myth: "I'll start saving when I make more",
    reality:
      "Lifestyle inflation will absorb every raise. The habit must come before the higher income.",
    verdict: "A trap",
    color: "#EF4444",
  },
  {
    myth: "Having a budget means you can't enjoy life",
    reality:
      "A budget is permission to spend — guilt-free — on what you actually value.",
    verdict: "False",
    color: "#EF4444",
  },
];

export const scenarios = [
  {
    id: "car",
    age: 22,
    title: "Your first paycheck hits. What do you do?",
    context: "You just got your first real job. $3,200 hits your account.",
    choices: [
      {
        label: "Finance a new car",
        icon: <Car size={24} />,
        desc: "$450/mo, 7% APR, 5 years",
        impact: -12800,
        mood: "danger",
        lesson:
          "That $450/mo compounds against you. At 7% APR over 5 years, you pay $2,800 in interest alone.",
      },
      {
        label: "Buy used, invest the rest",
        icon: <Lightbulb size={24} />,
        desc: "$8k used car, $200/mo invested",
        impact: 18400,
        mood: "success",
        lesson:
          "Investing $200/mo at 7% for 10 years = $34,000. You turned a boring decision into financial freedom.",
      },
      {
        label: "Lease a luxury car",
        icon: <Wallet size={24} />,
        desc: "$550/mo, own nothing at the end",
        impact: -19800,
        mood: "danger",
        lesson:
          "After 3 years you own nothing and paid $19,800. Leasing transfers wealth from you to the dealership.",
      },
    ],
  },
  {
    id: "credit",
    age: 24,
    title: "Your credit card balance hits $3,000.",
    context:
      "Life happened. Emergency, a trip, whatever. You owe $3,000 at 22% APR.",
    choices: [
      {
        label: "Pay only the minimum",
        icon: <AlertCircle size={24} />,
        desc: "$45/mo minimum payment",
        impact: -2340,
        mood: "danger",
        lesson:
          "At minimum payments, $3,000 at 22% APR takes 9 years and costs $2,340 extra in interest.",
      },
      {
        label: "Avalanche method",
        icon: <Zap size={24} />,
        desc: "Attack the highest APR first",
        impact: 1800,
        mood: "success",
        lesson:
          "Paying $300/mo clears the debt in 11 months and saves $1,800 in interest.",
      },
      {
        label: "Transfer to 0% card",
        icon: <RefreshCw size={24} />,
        desc: "Balance transfer, pay it down",
        impact: 1200,
        mood: "success",
        lesson:
          "A 0% balance transfer buys you 15 months interest-free. Every dollar goes to principal.",
      },
    ],
  },
  {
    id: "savings",
    age: 27,
    title: "Your company offers a 401(k) match.",
    context: "They'll match 100% up to 5% of your salary. You earn $65,000.",
    choices: [
      {
        label: "Skip it, need the money",
        icon: <XCircle size={24} />,
        desc: "No contribution",
        impact: -89000,
        mood: "danger",
        lesson:
          "Not contributing is a 100% instant loss. Over 20 years at 7%, that's $133,000 you walked away from.",
      },
      {
        label: "Match only (5%)",
        icon: <CheckCircle size={24} />,
        desc: "Contribute exactly 5%",
        impact: 89000,
        mood: "success",
        lesson:
          "Capturing the full match means $6,500/yr invested. That's a 100% instant return.",
      },
      {
        label: "Max it out (15%)",
        icon: <Rocket size={24} />,
        desc: "Contribute 15% of salary",
        impact: 267000,
        mood: "success",
        lesson:
          "Contributing 15% + match = $13,000/yr invested. At 7% for 20 years: $535,000.",
      },
    ],
  },
];
