'use client';

import { useState, useEffect } from 'react';
import {
  CuboidIcon as CubeIcon,
  CoinsIcon,
  NetworkIcon,
  HashIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AnalysisForm from '@/components/dashboard/analysis-form';
import Image from 'next/image';

export default function Dashboard() {
  const [info, setInfo] = useState<BlockchainInfo | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<RecentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBitcoinInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bitcoin-info');
      if (!response.ok) {
        throw new Error('Failed to fetch Bitcoin info');
      }
      const data: BlockchainInfo = await response.json();
      setInfo(data);

      // Fetch recent blocks
      const blocksResponse = await fetch('/api/recent-blocks');
      if (!blocksResponse.ok) {
        throw new Error('Failed to fetch recent blocks');
      }
      const blocksData: RecentBlock[] = await blocksResponse.json();
      setRecentBlocks(blocksData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBitcoinInfo();
  }, []);

  return (
    <div className="flex h-screen bg-background dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-card dark:bg-gray-800">
        <div className="flex items-center justify-center h-16 bg-primary dark:bg-gray-700">
          <Image
            src="/logo/nocking.png"
            alt="Nocking logo"
            width={196}
            height={64}
            className="dark:invert"
          />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground dark:text-gray-300 hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <CubeIcon className="mr-2 h-4 w-4" />
            Blocks
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground dark:text-gray-300 hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <CoinsIcon className="mr-2 h-4 w-4" />
            Transactions
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground dark:text-gray-300 hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <NetworkIcon className="mr-2 h-4 w-4" />
            Network
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground dark:text-gray-300 hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <HashIcon className="mr-2 h-4 w-4" />
            Mempool
          </Button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-card dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-foreground dark:text-white">
            Dashboard
          </h2>
          <Button onClick={fetchBitcoinInfo} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-background dark:bg-gray-900">
          <AnalysisForm />

          {error && <div className="text-red-500 mb-4">Error: {error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground dark:text-white">
                  Node Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div>Loading...</div>
                ) : info ? (
                  <Table>
                    <TableBody>
                      <TableRow className="border-b dark:border-gray-700">
                        <TableCell className="font-medium text-foreground dark:text-gray-300">
                          Chain
                        </TableCell>
                        <TableCell className="text-foreground dark:text-gray-300">
                          {info.chain}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-b dark:border-gray-700">
                        <TableCell className="font-medium text-foreground dark:text-gray-300">
                          Blocks
                        </TableCell>
                        <TableCell className="text-foreground dark:text-gray-300">
                          {info.blocks}
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-b dark:border-gray-700">
                        <TableCell className="font-medium text-foreground dark:text-gray-300">
                          Difficulty
                        </TableCell>
                        <TableCell className="text-foreground dark:text-gray-300">
                          {info.difficulty}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-foreground dark:text-gray-300">
                          Median Time
                        </TableCell>
                        <TableCell className="text-foreground dark:text-gray-300">
                          {new Date(info.mediantime * 1000).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : null}
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground dark:text-white">
                  Recent Blocks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div>Loading...</div>
                ) : recentBlocks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b dark:border-gray-700">
                        <TableHead className="text-foreground dark:text-gray-300">
                          Height
                        </TableHead>
                        <TableHead className="text-foreground dark:text-gray-300">
                          Time
                        </TableHead>
                        <TableHead className="text-foreground dark:text-gray-300">
                          Transactions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentBlocks.map((block) => (
                        <TableRow
                          key={block.hash}
                          className="border-b dark:border-gray-700"
                        >
                          <TableCell className="text-foreground dark:text-gray-300">
                            {block.height}
                          </TableCell>
                          <TableCell className="text-foreground dark:text-gray-300">
                            {new Date(block.time * 1000).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-foreground dark:text-gray-300">
                            {block.txcount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
