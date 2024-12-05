"use client"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

interface Coin {
    id: string
    symbol: string
    name: string
}

export default function DashboardPage() {
    const [open, setOpen] = useState(false)
    const [coins, setCoins] = useState<Coin[]>([])
    const [selectedCoin, setSelectedCoin] = useState<string>("")
    const [selectedCoinName, setSelectedCoinName] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [coinData, setCoinData] = useState<{ curPrice: number, marketCap: number, sparkline: number[] } | null>(null)

    useEffect(() => {
        const fetchCoins = async () => {
            try {
                const options = {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        'x-cg-demo-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
                    }
                };

                const currenciesRes = await fetch('https://api.coingecko.com/api/v3/simple/supported_vs_currencies', options)
                const availableCurrencies = await currenciesRes.json()

                const coinsRes = await fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=false', options)
                const coinsData = await coinsRes.json()

                const coinsFiltered = coinsData.filter((coin: Coin) =>
                    availableCurrencies.includes(coin.symbol.toLowerCase())
                )
                setCoins(coinsFiltered)
            } catch (error) {
                console.error('Error:', error)
                toast.error('Failed to fetch coins')
            } finally {
                setLoading(false)
            }
        }

        fetchCoins()
    }, [])

    useEffect(() => {
        if (selectedCoin) {
            const fetchCoinData = async () => {
                try {
                    const options = {
                        method: 'GET',
                        headers: {
                            accept: 'application/json',
                            'x-cg-demo-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
                        }
                    };

                    const res = await fetch(
                        `https://api.coingecko.com/api/v3/coins/${selectedCoin}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`,
                        options
                    )
                    const data = await res.json()

                    setCoinData({
                        curPrice: data.market_data.current_price.usd,
                        marketCap: data.market_data.market_cap.usd,
                        sparkline: data.market_data.sparkline_7d.price
                    })
                } catch (error) {
                    console.error('Error fetching coin data:', error)
                    toast.error('Failed to fetch coin data')
                }
            }

            fetchCoinData()
        }
    }, [selectedCoin])

    
    const formatChartData = (sparkline: number[]) => {
        return sparkline.map((price, index) => ({
            time: index,
            price: price
        }))
    }

    const formatTooltipTime = (time: number) => {
        const hoursAgo = 168 - time;
        if (hoursAgo === 0) return 'Now';
        if (hoursAgo === 1) return '1 hour ago';
        if (hoursAgo < 24) return `${hoursAgo} hours ago`;
        const daysAgo = Math.floor(hoursAgo / 24);
        return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    }

    const formatPrice = (price: number) => {
        return `$${price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    return (
        <div className="w-screen h-screen container">
            <div className="text-2xl font-bold p-6">Crypto Tracker</div>
            <div className="min-w-max w-full flex gap-20">
                <div className="flex flex-col gap-1 m-6 w-max">
                    <div className="">Select a coin</div>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-[200px] justify-between"
                            >
                                {selectedCoin
                                    ? coins.find((coin) => coin.id === selectedCoin)?.name
                                    : "Select coin..."}
                                <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="ml-3 w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Search coins..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No coin found.</CommandEmpty>
                                    <CommandGroup>
                                        {coins.map((coin) => (
                                            <CommandItem
                                                key={coin.id}
                                                value={coin.id}
                                                onSelect={(currentValue) => {
                                                    setSelectedCoin(currentValue === selectedCoin ? "" : currentValue)
                                                    setSelectedCoinName(coin.name)
                                                    setOpen(false)
                                                }}
                                            >
                                                <div className="my-1 w-full flex flex-col justify-between gap-1">
                                                    <div className="w-full flex justify-between items-center gap-2">
                                                        <div>{coin.name}</div>
                                                        <div>{coin.symbol.toUpperCase()}</div>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {coin.id}
                                                    </div>
                                                </div>
                                                <Check
                                                    className={cn(
                                                        "ml-auto",
                                                        selectedCoin === coin.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {selectedCoin && coinData && (
                    <div className="space-y-6 w-3/5">
                        <div className="flex items-center justify-evenly">
                            <h2 className="text-xl font-semibold">{selectedCoinName}</h2>
                            <p>Current Price: $ {coinData.curPrice.toLocaleString()}</p>
                            <p>Market Cap: $ {coinData.marketCap.toLocaleString()}</p>
                        </div>

                        <div className="h-[400px] w-full mt-4">
                            {coinData.sparkline && coinData.sparkline.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={formatChartData(coinData.sparkline)}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="time"
                                            tickFormatter={formatTooltipTime}
                                            interval={24}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                                        />
                                        <Tooltip
                                            labelFormatter={formatTooltipTime}
                                            formatter={(value: number) => [formatPrice(value), 'Price']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#8884d8"
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center border border-dashed rounded-lg">
                                    <div className="text-center text-muted-foreground">
                                        <p>No price history available for {selectedCoinName}</p>
                                        <p className="text-sm mt-1">Chart data could not be loaded</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
