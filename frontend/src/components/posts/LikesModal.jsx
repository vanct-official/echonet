// LikesModal.jsx
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  Avatar,
  Text,
} from "@chakra-ui/react";
import VerifiedBadgeSVG from "/verified-badge-svgrepo-com.svg";
import { Image } from "@chakra-ui/react";

const VerifiedBadgeIcon = () => (
  <Image src={VerifiedBadgeSVG} alt="Verified Badge" w="14px" h="14px" ml={1} display="inline-block" />
);

export default function LikesModal({ isOpen, onClose, users }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Danh sách đã thích</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {users?.length === 0 ? (
            <Text>Chưa có ai thích bài viết.</Text>
          ) : (
            <VStack align="start" spacing={3}>
              {users.map((user) => (
                <HStack key={user._id} spacing={3}>
                  <Avatar size="sm" src={user.avatar} name={user.username} />
                  <Text fontWeight="bold">
                    {user.username}
                    {user.isVerified && <VerifiedBadgeIcon />}
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
