'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Blocks, Cpu, HardDrive, AlertTriangle, RefreshCw, Link, Clock, Shield } from 'lucide-react'

interface NodeInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  time: number;
  mediantime: number;
  verificationprogress: number;
  initialblockdownload: boolean;
  chainwork: string;
  size_on_disk: number;
  pruned: boolean;
  warnings: string;
}

interface HealthInfo {
    blockchain_info: NodeInfo;
}

export default function HealthPage() {
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchNodeInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/node-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch node information');
      }

      const data: NodeInfo = await response.json();
      setNodeInfo(data.blockchain_info);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load node information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodeInfo();
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-[250px]" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-[120px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[150px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log(nodeInfo);


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bitcoin Node Dashboard</h1>
        <Button onClick={fetchNodeInfo}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      
      {nodeInfo && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Chain Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Link className="mr-2 h-4 w-4" />
                  <span className="font-medium">Chain:&nbsp;</span> {nodeInfo.chain}
                </div>
                <div className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  <span className="font-medium">Difficulty:&nbsp;</span> {Number(nodeInfo.difficulty).toFixed(2)}
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span className="font-medium">Median Time:&nbsp;</span> {formatDate(nodeInfo.mediantime)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Block Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Blocks className="mr-2 h-4 w-4" />
                  <span className="font-medium">Blocks:&nbsp;</span> {nodeInfo.blocks}
                </div>
                <div className="flex items-center">
                  <Cpu className="mr-2 h-4 w-4" />
                  <span className="font-medium">Headers:&nbsp;</span> {nodeInfo.headers}
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span className="font-medium">Initial Block Download:&nbsp;</span> {nodeInfo.initialblockdownload ? 'Yes' : 'No'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <HardDrive className="mr-2 h-4 w-4" />
                  <span className="font-medium">Size on Disk:&nbsp;</span> {formatBytes(nodeInfo.size_on_disk)}
                </div>
                <div className="flex items-center">
                  <Cpu className="mr-2 h-4 w-4" />
                  <span className="font-medium">Pruned:&nbsp;</span> {nodeInfo.pruned ? 'Yes' : 'No'}
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span className="font-medium">Warnings:&nbsp;</span> {nodeInfo.warnings || 'None'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Block</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="break-all">
                  <span className="font-medium">Hash:&nbsp;</span> {nodeInfo.bestblockhash}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Progress:&nbsp;</span> {(nodeInfo.verificationprogress * 100).toFixed(2)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chain Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="break-all">
                  <span className="font-medium">Work:&nbsp;</span> {nodeInfo.chainwork}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

