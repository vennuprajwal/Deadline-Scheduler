#!/usr/bin/env python3
"""Test script for deadline scheduler."""

import sys
sys.path.insert(0, '.')

# Import the functions from deadline_scheduler
from deadline_scheduler import Job, find_max_profit, get_rejected_jobs, find_critical_slot

def test_case_1():
    """Test case 1 from problem statement."""
    print("=== Test Case 1 ===")
    jobs = [
        Job(1, 2, 100),
        Job(2, 1, 19),
        Job(3, 2, 27),
        Job(4, 1, 25),
        Job(5, 3, 15)
    ]
    available_slots = [True, True, True]  # 3 slots
    
    base_profit, base_assignments = find_max_profit(jobs, available_slots)
    rejected = get_rejected_jobs(jobs, base_assignments)
    critical_slot, loss, after_profit, after_assignments = find_critical_slot(
        jobs, available_slots, base_profit, base_assignments
    )
    
    print(f"BASE_PROFIT {base_profit}")
    print(f"BASE_SLOTS {' '.join(map(str, base_assignments))}")
    print(f"REJECTED {' '.join(map(str, rejected))}")
    print(f"CRITICAL_SLOT {critical_slot}")
    print(f"LOSS {loss}")
    print(f"AFTER_PROFIT {after_profit}")
    print(f"AFTER_SLOTS {' '.join(map(str, after_assignments))}")
    print()

def test_case_2():
    """Test case 2 from problem statement."""
    print("=== Test Case 2 ===")
    jobs = [
        Job(10, 1, 50),
        Job(20, 3, 20),
        Job(30, 2, 10)
    ]
    available_slots = [False, True, False]  # Only slot 2 available
    
    base_profit, base_assignments = find_max_profit(jobs, available_slots)
    rejected = get_rejected_jobs(jobs, base_assignments)
    critical_slot, loss, after_profit, after_assignments = find_critical_slot(
        jobs, available_slots, base_profit, base_assignments
    )
    
    print(f"BASE_PROFIT {base_profit}")
    print(f"BASE_SLOTS {' '.join(map(str, base_assignments))}")
    print(f"REJECTED {' '.join(map(str, rejected))}")
    print(f"CRITICAL_SLOT {critical_slot}")
    print(f"LOSS {loss}")
    print(f"AFTER_PROFIT {after_profit}")
    print(f"AFTER_SLOTS {' '.join(map(str, after_assignments))}")
    print()

def test_case_3():
    """Test case 3 - original."""
    print("=== Test Case 3 ===")
    jobs = [
        Job(10, 4, 100),
        Job(20, 2, 50),
        Job(30, 3, 75),
        Job(40, 1, 25)
    ]
    available_slots = [True, False, True, True]  # Slot 2 unavailable
    
    base_profit, base_assignments = find_max_profit(jobs, available_slots)
    rejected = get_rejected_jobs(jobs, base_assignments)
    critical_slot, loss, after_profit, after_assignments = find_critical_slot(
        jobs, available_slots, base_profit, base_assignments
    )
    
    print(f"BASE_PROFIT {base_profit}")
    print(f"BASE_SLOTS {' '.join(map(str, base_assignments))}")
    print(f"REJECTED {' '.join(map(str, rejected))}")
    print(f"CRITICAL_SLOT {critical_slot}")
    print(f"LOSS {loss}")
    print(f"AFTER_PROFIT {after_profit}")
    print(f"AFTER_SLOTS {' '.join(map(str, after_assignments))}")
    print()

def test_case_4():
    """Test case 4 - tie breaking."""
    print("=== Test Case 4 (Tie Breaking) ===")
    jobs = [
        Job(1, 3, 50),
        Job(2, 2, 50),
        Job(3, 1, 50)
    ]
    available_slots = [True, True, True]
    
    base_profit, base_assignments = find_max_profit(jobs, available_slots)
    rejected = get_rejected_jobs(jobs, base_assignments)
    critical_slot, loss, after_profit, after_assignments = find_critical_slot(
        jobs, available_slots, base_profit, base_assignments
    )
    
    print(f"BASE_PROFIT {base_profit}")
    print(f"BASE_SLOTS {' '.join(map(str, base_assignments))}")
    print(f"REJECTED {' '.join(map(str, rejected))}")
    print(f"CRITICAL_SLOT {critical_slot}")
    print(f"LOSS {loss}")
    print(f"AFTER_PROFIT {after_profit}")
    print(f"AFTER_SLOTS {' '.join(map(str, after_assignments))}")
    print()

def test_case_5():
    """Test case 5 - no jobs after loss."""
    print("=== Test Case 5 (No Jobs After Loss) ===")
    jobs = [
        Job(1, 1, 100),
        Job(2, 1, 200)
    ]
    available_slots = [True, True]
    
    base_profit, base_assignments = find_max_profit(jobs, available_slots)
    rejected = get_rejected_jobs(jobs, base_assignments)
    critical_slot, loss, after_profit, after_assignments = find_critical_slot(
        jobs, available_slots, base_profit, base_assignments
    )
    
    print(f"BASE_PROFIT {base_profit}")
    print(f"BASE_SLOTS {' '.join(map(str, base_assignments))}")
    print(f"REJECTED {' '.join(map(str, rejected))}")
    print(f"CRITICAL_SLOT {critical_slot}")
    print(f"LOSS {loss}")
    print(f"AFTER_PROFIT {after_profit}")
    print(f"AFTER_SLOTS {' '.join(map(str, after_assignments))}")
    print()

if __name__ == "__main__":
    test_case_1()
    test_case_2()
    test_case_3()
    test_case_4()
    test_case_5()
    print("All tests completed!")