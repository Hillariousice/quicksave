import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Transaction {
  id: string;
  member: string;
  email: string;
  type: "Contribution" | "Payout";
  amount: string;
  date: string;
  status: "Success" | "Pending";
}

export default function TransactionTable({ data, onClick }: { data: Transaction[], onClick: () => void }) {
  return (
    <div className="bg-white dark:bg-[#11181C] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm transition-colors">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold">Recent Transaction History</h3>
          <p className="text-sm text-gray-500">Real-time contribution and payout feed.</p>
        </div>
        <button className="text-xs font-bold bg-gray-100 dark:bg-[#1A2126] px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300" onClick={onClick}>
          VIEW FULL LEDGER
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200 dark:border-gray-800 uppercase text-[10px] tracking-wider">
              <th className="pb-4 font-semibold">MEMBER</th>
              <th className="pb-4 font-semibold">TYPE</th>
              <th className="pb-4 font-semibold">AMOUNT</th>
              <th className="pb-4 font-semibold">DATE</th>
              <th className="pb-4 font-semibold text-right">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((tx: any) => (
              <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold">
                      {tx.member.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{tx.member}</p>
                      <p className="text-xs text-gray-500">{tx.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`flex items-center gap-1 ${tx.type === 'Contribution' ? 'text-emerald-500' : 'text-[#FF8C00]'}`}>
                    {tx.type === 'Contribution' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {tx.type}
                  </span>
                </td>
                <td className="py-4 font-bold">{tx.amount}</td>
                <td className="py-4 text-gray-500">{tx.date}</td>
                <td className="py-4 text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tx.status === 'Success' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}