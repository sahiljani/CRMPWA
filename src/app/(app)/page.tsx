"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Users, LineChart, CheckCircle, AlertCircle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from "recharts"
import Link from 'next/link';


// Dummy data for charts and metrics - replace with actual data fetching later
const totalLeads = 1250;
const newLeadsThisMonth = 150;
const conversionRate = 12; // percentage
const leadsBySource = [
    { source: 'Website', leads: 400, fill: "hsl(var(--chart-1))" }, // Orange
    { source: 'Referral', leads: 300, fill: "hsl(var(--chart-2))" }, // Yellow
    { source: 'Cold Call', leads: 200, fill: "hsl(var(--chart-4))" }, // Blue
    { source: 'Ads', leads: 250, fill: "hsl(var(--chart-5))" }, // Green
    { source: 'Other', leads: 100, fill: "hsl(var(--muted))" }, // Muted
];

const salesTrendData = [
  { month: "Jan", leads: 186 },
  { month: "Feb", leads: 305 },
  { month: "Mar", leads: 237 },
  { month: "Apr", leads: 173 },
  { month: "May", leads: 209 },
  { month: "Jun", leads: 214 },
  { month: "Jul", leads: 250 },
  { month: "Aug", leads: 190 },
  { month: "Sep", leads: 220 },
  { month: "Oct", leads: 280 },
  { month: "Nov", leads: 250 },
  { month: "Dec", leads: 310 },
]


const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))", // Orange
  },
} satisfies ChartConfig

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
             <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            {/* Metric Blocks */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="rounded-lg shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-primary">{totalLeads.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">+ {newLeadsThisMonth} from last month</p>
                        <Link href="/leads" passHref>
                             <Button variant="outline" size="sm" className="mt-4 rounded-full">
                                View Leads <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
                <Card className="rounded-lg shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <CheckCircle className="h-5 w-5 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-accent">{conversionRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">+2% from last month</p>
                         <Button variant="outline" size="sm" className="mt-4 rounded-full">
                            Analyze <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="rounded-lg shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leads Requiring Action</CardTitle>
                        <AlertCircle className="h-5 w-5 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-destructive">32</div>
                        <p className="text-xs text-muted-foreground mt-1">Needs follow-up today</p>
                        <Link href="/leads?status=action_required" passHref>
                             <Button variant="destructive" size="sm" className="mt-4 rounded-full">
                                View Now <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Trend Chart */}
             <Card className="rounded-lg shadow-md">
                <CardHeader>
                    <CardTitle>Lead Generation Trend</CardTitle>
                    <CardDescription>Monthly leads generated over the year</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={salesTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" hideLabel />}
                                    />
                                <Legend content={<ChartLegendContent />} />
                                <Bar dataKey="leads" fill="var(--color-leads)" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

             {/* Lead Source Distribution Chart - Example (could be Pie or Bar) */}
             {/* You can add another chart here if needed, e.g., for lead source distribution */}
             {/* <Card className="rounded-lg shadow-md">
                <CardHeader>
                    <CardTitle>Lead Source Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    // Add PieChart or another BarChart here for leadsBySource
                </CardContent>
            </Card> */}

        </div>
    );
}

// Define ChartConfig type locally if not imported from chart component context
type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
}
