import React, { useState } from "react";
import {
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";

export default function SearchUser({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <InputGroup maxW="md" mx="auto" my={4}>
      <Input
        placeholder="Tìm kiếm theo username hoặc số điện thoại..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleEnter}
      />
      <InputRightElement>
        <IconButton
          icon={<FaSearch />}
          aria-label="search"
          onClick={handleSearch}
          variant="ghost"
        />
      </InputRightElement>
    </InputGroup>
  );
}
