"""
Test file to verify all AI package imports work correctly
Run this to test the integration with core/main.py
"""

import sys
import os

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_ai_imports():
    """Test that all AI package components can be imported"""
    
    print("Testing AI package imports...")
    
    try:
        # Test main AI package imports
        from ai import (
            FinancialOrchestrator,
            QuantitativeAnalystAgent,
            FinancialTutorAgent,
            StrategyRebalancingAgent,
            StrategyArchitectAgent,
            PortfolioSentinelAgent,
            AutoGenConversationManager
        )
        print("✅ Main AI package imports successful")
        
        # Test agent creation
        orchestrator = FinancialOrchestrator()
        print("✅ Orchestrator creation successful")
        
        # Test individual agents
        quant_agent = QuantitativeAnalystAgent()
        tutor_agent = FinancialTutorAgent()
        print("✅ Individual agent creation successful")
        
        # Test tools
        from ai.tools.quant_tools import get_quantitative_tools, QUANTITATIVE_TOOLS
        from ai.tools.data_tools import get_data_tools, DATA_TOOLS
        
        tools = get_quantitative_tools()
        print(f"✅ Loaded {len(tools)} quantitative tools")
        
        data_tools = get_data_tools()
        print(f"✅ Loaded {len(data_tools)} data tools")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def test_core_integration():
    """Test integration with core/main.py"""
    
    print("\nTesting core integration...")
    
    try:
        # This would be added to core/main.py
        from ai import FinancialOrchestrator
        
        # Initialize orchestrator in main app
        orchestrator = FinancialOrchestrator()
        
        print("✅ Core integration test successful")
        print(f"✅ Orchestrator initialized with {len(orchestrator.agents)} agents")
        
        return True
        
    except Exception as e:
        print(f"❌ Core integration error: {e}")
        return False


async def test_async_functionality():
    """Test async functionality of the AI system"""
    
    print("\nTesting async functionality...")
    
    try:
        from ai import FinancialOrchestrator
        
        orchestrator = FinancialOrchestrator()
        
        # Test async query processing
        test_query = "Calculate the risk metrics for my portfolio"
        response = await orchestrator.process_query(test_query)
        
        print("✅ Async query processing successful")
        print(f"✅ Response type: {type(response)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Async functionality error: {e}")
        return False


if __name__ == "__main__":
    import asyncio
    
    print("=" * 50)
    print("AI Package Integration Tests")
    print("=" * 50)
    
    # Run synchronous tests
    import_success = test_ai_imports()
    core_success = test_core_integration()
    
    # Run async tests
    async_success = asyncio.run(test_async_functionality())
    
    print("\n" + "=" * 50)
    print("Test Results Summary:")
    print("=" * 50)
    print(f"Import Tests: {'✅ PASS' if import_success else '❌ FAIL'}")
    print(f"Core Integration: {'✅ PASS' if core_success else '❌ FAIL'}")
    print(f"Async Functionality: {'✅ PASS' if async_success else '❌ FAIL'}")
    
    if all([import_success, core_success, async_success]):
        print("\n🎉 All tests passed! AI package is ready for integration.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")