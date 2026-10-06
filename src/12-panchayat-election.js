/**
 * 🗳️ Panchayat Election System - Capstone
 *
 * Village ki panchayat election ka system bana! Yeh CAPSTONE challenge hai
 * jisme saare function concepts ek saath use honge:
 * closures, callbacks, HOF, factory, recursion, pure functions.
 *
 * Functions:
 *
 *   1. createElection(candidates)
 *      - CLOSURE: private state (votes object, registered voters set)
 *      - candidates: array of { id, name, party }
 *      - Returns object with methods:
 *
 *      registerVoter(voter)
 *        - voter: { id, name, age }
 *        - Add to private registered set. Return true.
 *        - Agar already registered or voter invalid, return false.
 *        - Agar age < 18, return false.
 *
 *      castVote(voterId, candidateId, onSuccess, onError)
 *        - CALLBACKS: call onSuccess or onError based on result
 *        - Validate: voter registered? candidate exists? already voted?
 *        - If valid: record vote, call onSuccess({ voterId, candidateId })
 *        - If invalid: call onError("reason string")
 *        - Return the callback's return value
 *
 *      getResults(sortFn)
 *        - HOF: takes optional sort comparator function
 *        - Returns array of { id, name, party, votes: count }
 *        - If sortFn provided, sort results using it
 *        - Default (no sortFn): sort by votes descending
 *
 *      getWinner()
 *        - Returns candidate object with most votes
 *        - If tie, return first candidate among tied ones
 *        - If no votes cast, return null
 *
 *   2. createVoteValidator(rules)
 *      - FACTORY: returns a validation function
 *      - rules: { minAge: 18, requiredFields: ["id", "name", "age"] }
 *      - Returned function takes a voter object and returns { valid, reason }
 *
 *   3. countVotesInRegions(regionTree)
 *      - RECURSION: count total votes in nested region structure
 *      - regionTree: { name, votes: number, subRegions: [...] }
 *      - Sum votes from this region + all subRegions (recursively)
 *      - Agar regionTree null/invalid, return 0
 *
 *   4. tallyPure(currentTally, candidateId)
 *      - PURE FUNCTION: returns NEW tally object with incremented count
 *      - currentTally: { "cand1": 5, "cand2": 3, ... }
 *      - Return new object where candidateId count is incremented by 1
 *      - MUST NOT modify currentTally
 *      - If candidateId not in tally, add it with count 1
 *
 * @example
 *   const election = createElection([
 *     { id: "C1", name: "Sarpanch Ram", party: "Janata" },
 *     { id: "C2", name: "Pradhan Sita", party: "Lok" }
 *   ]);
 *   election.registerVoter({ id: "V1", name: "Mohan", age: 25 });
 *   election.castVote("V1", "C1", r => "voted!", e => "error: " + e);
 *   // => "voted!"
 */
/**
 * 1. createElection(candidates)
 * Implements closures, callbacks, higher-order functions, and private state.
 */
export function createElection(candidates = []) {
  // PRIVATE STATE
  const registeredVoters = new Set();
  const votedVoters = new Set();

  // Initialize candidates list and internal vote counts
  const candidateList = Array.isArray(candidates)
    ? candidates.map(c => ({ ...c }))
    : [];

  const votes = {};
  for (const c of candidateList) {
    votes[c.id] = 0;
  }

  return {
    registerVoter(voter) {
      if (!voter || typeof voter !== "object") return false;
      if (!voter.id || !voter.name || typeof voter.age !== "number") return false;
      if (voter.age < 18) return false;
      if (registeredVoters.has(voter.id)) return false;

      registeredVoters.add(voter.id);
      return true;
    },

    castVote(voterId, candidateId, onSuccess, onError) {
      const successHandler = typeof onSuccess === "function" ? onSuccess : () => {};
      const errorHandler = typeof onError === "function" ? onError : () => {};

      if (!registeredVoters.has(voterId)) {
        return errorHandler("Voter is not registered");
      }

      if (votedVoters.has(voterId)) {
        return errorHandler("Voter has already voted");
      }

      if (!(candidateId in votes)) {
        return errorHandler("Candidate does not exist");
      }

      // Record vote
      votes[candidateId] += 1;
      votedVoters.add(voterId);

      return successHandler({ voterId, candidateId });
    },

    getResults(sortFn) {
      const results = candidateList.map(c => ({
        id: c.id,
        name: c.name,
        party: c.party,
        votes: votes[c.id] || 0
      }));

      if (typeof sortFn === "function") {
        return results.sort(sortFn);
      }

      // Default: descending by votes
      return results.sort((a, b) => b.votes - a.votes);
    },

    getWinner() {
      if (votedVoters.size === 0) {
        return null;
      }

      let topCandidate = null;
      let maxVotes = -1;

      for (const c of candidateList) {
        const count = votes[c.id] || 0;
        if (count > maxVotes) {
          maxVotes = count;
          topCandidate = { id: c.id, name: c.name, party: c.party, votes: count };
        }
      }

      return topCandidate;
    }
  };
}

/**
 * 2. createVoteValidator(rules)
 * FACTORY FUNCTION: Returns a customized validator function.
 */
export function createVoteValidator(rules = {}) {
  const minAge = rules.minAge ?? 18;
  const requiredFields = rules.requiredFields ?? ["id", "name", "age"];

  return function validate(voter) {
    if (!voter || typeof voter !== "object") {
      return { valid: false, reason: "Invalid voter object" };
    }

    for (const field of requiredFields) {
      if (voter[field] === undefined || voter[field] === null || voter[field] === "") {
        return { valid: false, reason: `Missing required field: ${field}` };
      }
    }

    if (typeof voter.age === "number" && voter.age < minAge) {
      return { valid: false, reason: `Voter must be at least ${minAge} years old` };
    }

    return { valid: true, reason: null };
  };
}

/**
 * 3. countVotesInRegions(regionTree)
 * RECURSIVE FUNCTION: Traverses tree of nested sub-regions.
 */
export function countVotesInRegions(regionTree) {
  if (!regionTree || typeof regionTree !== "object") {
    return 0;
  }

  const currentVotes = typeof regionTree.votes === "number" ? regionTree.votes : 0;

  if (!Array.isArray(regionTree.subRegions) || regionTree.subRegions.length === 0) {
    return currentVotes;
  }

  const subRegionVotes = regionTree.subRegions.reduce((sum, sub) => {
    return sum + countVotesInRegions(sub);
  }, 0);

  return currentVotes + subRegionVotes;
}

/**
 * 4. tallyPure(currentTally, candidateId)
 * PURE FUNCTION: Returns a new object without mutating the original.
 */
export function tallyPure(currentTally = {}, candidateId) {
  const currentCount = currentTally[candidateId] || 0;
  return {
    ...currentTally,
    [candidateId]: currentCount + 1
  };
}