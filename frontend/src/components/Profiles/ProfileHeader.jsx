import React from "react";
import { Box, Avatar, VStack, Text, HStack, Button } from "@chakra-ui/react";
import VerifiedBadge from "/verified-badge-svgrepo-com.svg";

export default function ProfileHeader({
  user,
  isCurrentUser = false,
  isFollowing = false,
  followersCount = 0,
  followingCount = 0,
  onFollowToggle,
}) {
  return (
    <Box
      w="full"
      textAlign="center"
      py={6}
      borderWidth="1px"
      borderRadius="md"
      mb={4}
    >
      <Avatar
        size="2xl"
        name={user.username}
        src={user.avatar || undefined}
        mb={4}
      />
      <HStack justify="center" spacing={2}>
        <Text fontSize="2xl" fontWeight="bold">
          {user.firstname} {user.lastname}
        </Text>
        {user.isVerified && (
          <img
            src={VerifiedBadge}
            alt="Verified"
            style={{ width: "20px", height: "20px" }}
          />
        )}
        {user.role === "admin" && (
          <Box
            as="span"
            bg="green.500"
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
            ml={2}
          >
            Admin
          </Box>
        )}
      </HStack>
      <Text fontSize="xl" fontWeight="medium">
        @{user.username}
      </Text>
      {user.bio && (
        <Text fontSize="md" color="gray.500" maxW="sm" mx="auto" mt={2}>
          {user.bio}
        </Text>
      )}

      {/* Follow / Unfollow button */}
      {!isCurrentUser && (
        <Button
          mt={4}
          colorScheme={isFollowing ? "gray" : "blue"}
          onClick={onFollowToggle}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </Button>
      )}

      {/* Stats */}
      <HStack spacing={8} mt={4} justify="center">
        <VStack spacing={0}>
          <Text fontWeight="bold">{followersCount}</Text>
          <Text fontSize="sm" color="gray.500">
            Followers
          </Text>
        </VStack>
        <VStack spacing={0}>
          <Text fontWeight="bold">{followingCount}</Text>
          <Text fontSize="sm" color="gray.500">
            Following
          </Text>
        </VStack>
        <VStack spacing={0}>
          <Text fontWeight="bold">{user.postsCount || 0}</Text>
          <Text fontSize="sm" color="gray.500">
            Posts
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}
