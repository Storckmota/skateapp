import React, { useEffect, useState } from 'react';
import { Box, Text, Flex, Image, VStack, HStack, Divider, Tooltip } from "@chakra-ui/react";
import { fetchConversionRate } from 'lib/pages/wallet/hive/hiveBalance';
import { VoteHistoryQuery, CurrationHistoryQuery } from './queries';
import { BalanceDisplay } from '../steemskate/hiveStats';

const SQL_ENDPOINT = 'https://www.stoken.quest/sql';

interface AccSummaryProps {
  username: string;
}

const AccSummary: React.FC<AccSummaryProps> = ({ username }) => {
  const [currationRewards, setCurrationRewards] = useState(0);
  const [voteRewards, setvoteRewards] = useState(0);
  const [totalVotes, setTotalVotes] = useState([] as any);
  const [totalAuthors, setTotalAuthors] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const getVotingSummary = async () => {
    // post request to hivesql edpoint
    const response = await fetch(SQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: VoteHistoryQuery(username),
      }),
    });

    const data = await response.json();

    setTotalVotes(data.length);

    // create a set of unique authors
    let uniqueAuthors = new Set();

    data.forEach((vote: any) => {
      uniqueAuthors.add(vote.author);
    });

    setTotalAuthors(uniqueAuthors.size);

    // calculate vote rewards
    let voteRewards = 0;

    data.forEach((vote: any) => {
      voteRewards += vote.vote_value;
    });

    setvoteRewards(voteRewards);
  }

  const getCurationSummary = async () => {
    // post request to hivesql edpoint
    const response = await fetch(SQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: CurrationHistoryQuery(username),
      }),
    });

    const data = await response.json();
    
    let currationRewards = 0;

    data.forEach((curration: any) => {
      currationRewards += curration.hp;
    });

    setCurrationRewards(currationRewards);
  }

  const getSummary = async () => {
    setIsLoading(true);

    await getVotingSummary();
    await getCurationSummary();

    const conversionRate = await fetchConversionRate();
    setConversionRate(conversionRate);

    setIsLoading(false);
  }

  useEffect(() => {
    if (username.length > 0)
      getSummary();
  }, [username]);

  return (
      <Box
              borderRadius="12px"
              border="2px solid red"
              padding="10px"
              width={['100%', '50%']} // Set width to 100% on mobile, 50% on other screen sizes
              margin="10px"
          >
            <VStack spacing={4} align="stretch">
                <Tooltip label={`Total value generated by @${username}`} >
                  <Flex alignItems="center" justifyContent="center" padding="10px">
                      <Image
                          src={`https://www.gnars.wtf/images/logo.png`}
                          boxSize="40px"
                      />
                      <Text
                          textAlign="center"
                          borderRadius="12px"
                          fontWeight="700"
                          fontSize="18px"
                          color="white"
                          padding="10px"
                      >
                        Shared Rewards
                      </Text>
                  </Flex>
                </Tooltip>
                <Divider backgroundColor="red" />

                <Flex alignItems="center" justifyContent="center">
                    <Text fontWeight="bold" color="orange">Total Value Generated: { !isLoading ? "$" + (voteRewards + (currationRewards * conversionRate)).toFixed(3) : "Loading..." }</Text>
                </Flex>
                <Divider backgroundColor="red" />
                <HStack spacing={4} align="stretch">
                    <BalanceDisplay 
                      label="Vote Rewards" 
                      balance={voteRewards ? voteRewards.toFixed(3) + " HBD" : "Loading..."}
                      labelTooltip="Total value of Votes given out in HBD (Hive Backed Dollars)"
                    />
                    <BalanceDisplay 
                      label="Curration Rewards" 
                      balance={currationRewards ? currationRewards.toFixed(3) + " HP" : "Loading..."}
                      labelTooltip="Total value of Curration Rewards in HP (Hive Power)"
                    />
                </HStack>
                <HStack spacing={4} align="stretch">
                    <BalanceDisplay 
                      label="Number of Votes" 
                      balance={totalVotes > 0 ? totalVotes : "Loading..."}
                      labelTooltip="Total number of votes given out"
                    />
                    <BalanceDisplay 
                      label="Unique Skaters Curated" 
                      balance={totalAuthors ? totalAuthors.toFixed(0) : "Loading..."}
                      labelTooltip="Number of unique skaters curated"
                    />
                </HStack>
                <HStack
                    margin="10px"
                    borderRadius="10px"
                    border="1px dashed orange"
                    justifyContent="center"
                    padding="10px"
                >
                    <Text color="white" fontSize="16px">
                      These stats are only from the account @{username} and do not include the vote trail that have been set up to support the skatehive community which increases the value of total rewards given out.
                    </Text>
                </HStack>
            </VStack>
      </Box>
    );
  
};

export default AccSummary;